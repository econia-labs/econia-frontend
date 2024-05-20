import { useEffect, useRef, useState } from "react";

import { GREEN_OPACITY_HALF, RED_OPACITY_HALF } from "@/constants";
import { MAX_ELEMENTS_PER_FETCH } from "@/constants";
import { type ApiMarket } from "@/types/api";
import { toDecimalPrice } from "@/utils/econia";
import { getAllDataInTimeRange } from "@/utils/helpers";

export const DAY_BY_RESOLUTION: { [key: string]: string } = {
  "1D": "86400",
  "30": "1800",
  "60": "3600",
  "15": "900",
  "240": "14400",
  "720": "43200",
  "5": "300",
  "1": "60",
};
export const MS_IN_ONE_DAY = 24 * 60 * 60 * 1000;

// This determines at what point in time the chart starts displaying data.
export const START_DAYS_AGO = 1;

// Time intervals in milliseconds.
export const UPDATE_FEED_INTERVAL = 10000;
export const FETCH_INTERVAL = 0;

export type PriceData = {
  [key: number]: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  };
};
export type VolumeData = {
  [key: number]: { time: number; value: number; color: string };
};

export type ChartData = {
  priceData: PriceData;
  volumeData: VolumeData;
  latestTime: Date;
};

export type ChartDataDictionary = {
  [marketID: number]: {
    [K in keyof typeof DAY_BY_RESOLUTION]?: ChartData;
  };
};

// Calculate scale factor relative to a specified base resolution.
// Essentially, this means we will display the amount of candles that
// would be displayed if the resolution was the base resolution.
const BASE_RESOLUTION_SECONDS = Number(DAY_BY_RESOLUTION["5"]);
const RESOLUTION_SCALE_FACTOR: {
  [key in keyof typeof DAY_BY_RESOLUTION]: number;
} = Object.keys(DAY_BY_RESOLUTION).reduce((acc, key) => {
  const currentResolutionNumber = Number(DAY_BY_RESOLUTION[key]);
  acc[key] = currentResolutionNumber / BASE_RESOLUTION_SECONDS;
  return acc;
}, {} as { [key in keyof typeof DAY_BY_RESOLUTION]: number });

export async function fetchChartData(
  queryName: string,
  start: Date,
  end: Date,
  selectedMarket: ApiMarket,
  resolution: keyof typeof DAY_BY_RESOLUTION,
  timezoneOffset: number,
): Promise<ChartData> {
  const queryParams = new URLSearchParams({
    market_id: `eq.${selectedMarket.market_id}`,
    resolution: `eq.${DAY_BY_RESOLUTION[resolution.toString()]}`,
    order: "start_time.asc",
  });
  const data = await getAllDataInTimeRange({
    queryName,
    queryParams,
    start,
    end,
  });

  const priceData: PriceData = {};
  const volumeData: VolumeData = {};
  let latestTime = new Date(0);

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  data.forEach((bar: any) => {
    const barTimeUTC = new Date(bar.start_time);
    const utcTime = barTimeUTC.getTime() / 1000;
    const localTimestamp =
      (barTimeUTC.getTime() - timezoneOffset * 60 * 1000) / 1000;
    latestTime = barTimeUTC;
    priceData[utcTime] = {
      time: localTimestamp,
      open: toDecimalPrice({
        price: bar.open,
        marketData: selectedMarket,
      }).toNumber(),
      high: toDecimalPrice({
        price: bar.high,
        marketData: selectedMarket,
      }).toNumber(),
      low: toDecimalPrice({
        price: bar.low,
        marketData: selectedMarket,
      }).toNumber(),
      close: toDecimalPrice({
        price: bar.close,
        marketData: selectedMarket,
      }).toNumber(),
    };
    volumeData[utcTime] = {
      time: localTimestamp,
      value: toDecimalPrice({
        price: bar.volume,
        marketData: selectedMarket,
      }).toNumber(),
      color: bar.close > bar.open ? RED_OPACITY_HALF : GREEN_OPACITY_HALF,
    };
  });

  return { priceData, volumeData, latestTime };
}

export function useChartData(
  resolution: keyof typeof DAY_BY_RESOLUTION,
  selectedMarket: ApiMarket,
) {
  const [chartDataDictionary, setChartDataDictionary] =
    useState<ChartDataDictionary>({});
  const chartDataRef = useRef<ChartDataDictionary>(chartDataDictionary);
  const schedulers = useRef<number[]>([]);
  // Instantiate a date within the client to get the timezone offset later.
  const localDate = useRef<Date>(new Date());

  useEffect(() => {
    const marketID = selectedMarket.market_id;
    if (!chartDataRef.current[marketID]) {
      chartDataRef.current[marketID] = {};
    }
    schedulers.current.forEach(clearTimeout);
    schedulers.current = [];
    // Calculate the initial start based off of the current time and a
    // scaled number of days ago.
    const scaledStartDaysAgo =
      START_DAYS_AGO * RESOLUTION_SCALE_FACTOR[resolution];
    const scaledInitialStart = new Date(
      new Date().getTime() - scaledStartDaysAgo * MS_IN_ONE_DAY,
    );

    // Fetch data for the current resolution, start the scheduler for it,
    // and store the scheduler in the state.
    const schedulerLoop = async (): Promise<number> => {
      try {
        schedulers.current.forEach(clearTimeout);
        schedulers.current = [];

        const latestForCurrentRes =
          chartDataRef.current[marketID][resolution]?.latestTime ||
          scaledInitialStart;

        const now = new Date();
        const chartData = await fetchChartData(
          "candlesticks",
          latestForCurrentRes,
          now,
          selectedMarket,
          resolution,
          localDate.current.getTimezoneOffset(),
        );

        const numElements = Object.keys(chartData.priceData).length;
        const returnedLatest = chartData.latestTime;
        const latestTime =
          returnedLatest > latestForCurrentRes
            ? returnedLatest
            : latestForCurrentRes;

        const updatedChartData = {
          ...chartDataRef.current,
          [marketID]: {
            [resolution]: {
              priceData: {
                ...(chartDataRef.current[marketID][resolution]?.priceData ||
                  {}),
                ...chartData.priceData,
              },
              volumeData: {
                ...(chartDataRef.current[marketID][resolution]?.volumeData ||
                  {}),
                ...chartData.volumeData,
              },
              latestTime,
            },
          },
        };
        chartDataRef.current = updatedChartData;

        // If the number of elements fetched < `MAX_ELEMENTS_PER_FETCH`
        // then wait for `UPDATE_FEED_INTERVAL` milliseconds before fetching again.
        if (numElements < MAX_ELEMENTS_PER_FETCH) {
          // Only update the state if we've fetched all the data to avoid
          // seeing the chart rapidly update on the first few initial fetches.
          setChartDataDictionary(chartDataRef.current);
          const schedulerID = setTimeout(
            () => schedulerLoop(),
            UPDATE_FEED_INTERVAL,
          ) as unknown as number;
          schedulers.current.push(schedulerID);
          return schedulerID;
        } else {
          // We fetched MAX_ELEMENTS_PER_FETCH elements, so only wait
          // `FETCH_INTERVAL` milliseconds.
          const schedulerID = setTimeout(
            () => schedulerLoop(),
            FETCH_INTERVAL,
          ) as unknown as number;
          schedulers.current.push(schedulerID);
          return schedulerID;
        }
      } catch (e) {
        console.error(e);
        return -1;
      }
    };

    // Add the initial scheduled timeout ID to the list of schedulers, so we
    // can end it in case the component unmounts or the resolution changes.
    schedulerLoop().then((schedulerID) => {
      schedulers.current.push(schedulerID);
    });

    return () => {
      // Clear all schedulers when the component unmounts.
      schedulers.current.forEach(clearTimeout);
      schedulers.current = [];
    };
  }, [resolution, selectedMarket]);

  return chartDataDictionary[selectedMarket.market_id]?.[resolution];
}
