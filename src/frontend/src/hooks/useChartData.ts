import { useEffect, useRef, useState } from "react";

import {
  GREEN_OPACITY_HALF,
  RED_OPACITY_HALF,
} from "@/components/trade/TVChartContainer";
import { API_URL } from "@/env";
import { type ApiMarket } from "@/types/api";
import { toDecimalPrice } from "@/utils/econia";

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
export const MAX_ELEMENTS_PER_FETCH = 100;

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
  [K in keyof typeof DAY_BY_RESOLUTION]?: ChartData;
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

export async function fetchData(
  start: Date,
  end: Date,
  priorLatestTime: Date,
  marketId: number,
  selectedMarket: ApiMarket,
  resolution: keyof typeof DAY_BY_RESOLUTION,
  timeEntriesSet: React.MutableRefObject<Set<string>>,
) {
  const url = new URL(
    `/candlesticks?${new URLSearchParams({
      market_id: `eq.${marketId}`,
      resolution: `eq.${DAY_BY_RESOLUTION[resolution]}`,
      and:
        `(start_time.lte.${end.toISOString()},` +
        `start_time.gte.${start.toISOString()})`,
    })}`,
    API_URL,
  ).href;

  const res = await fetch(url);
  const data = await res.json();
  let latestTime = priorLatestTime;

  const priceData: PriceData = {};
  const volumeData: VolumeData = {};
  let allDuplicates = true;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  data.forEach((bar: any) => {
    const barTime = new Date(bar.start_time);
    const time = barTime.getTime() / 1000;
    latestTime = latestTime >= barTime ? latestTime : barTime;
    // We only want to add the time entry if it doesn't already exist in the
    // set, unless it's the latest bar because the data might have changed.
    // Note that our set checks uniqueness by resolution and time, not just
    // time, because different time resolutions have different candlestick
    // and volume data.
    if (
      !timeEntriesSet.current.has(`${resolution}-${time}`) ||
      barTime.getTime() == priorLatestTime.getTime()
    ) {
      allDuplicates = false;
      timeEntriesSet.current.add(`${resolution}-${time}`);
      priceData[time] = {
        time,
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
      volumeData[time] = {
        time,
        value: toDecimalPrice({
          price: bar.volume,
          marketData: selectedMarket,
        }).toNumber(),
        color: bar.close > bar.open ? RED_OPACITY_HALF : GREEN_OPACITY_HALF,
      };
    }
  });

  return { priceData, volumeData, latestTime, allDuplicates };
}

export function useChartData(
  resolution: keyof typeof DAY_BY_RESOLUTION,
  selectedMarket: ApiMarket,
) {
  const [chartDataDictionary, setChartDataDictionary] =
    useState<ChartDataDictionary>({});
  const chartDataRef = useRef<ChartDataDictionary>(chartDataDictionary);
  const timeEntriesSet = useRef<Set<string>>(new Set());
  const schedulers = useRef<number[]>([]);

  useEffect(() => {
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
    const schedulerLoop = async (start: Date): Promise<number> => {
      try {
        schedulers.current.forEach(clearTimeout);
        schedulers.current = [];

        const now = new Date();
        const result = await fetchData(
          start,
          now,
          chartDataRef.current[resolution]?.latestTime || start,
          selectedMarket.market_id,
          selectedMarket,
          resolution,
          timeEntriesSet,
        );

        const numElements = Object.keys(result.priceData).length;
        const latestTime = result.latestTime;

        const updatedChartData = {
          ...chartDataRef.current,
          [resolution]: {
            priceData: {
              ...(chartDataRef.current[resolution]?.priceData || {}),
              ...result.priceData,
            },
            volumeData: {
              ...(chartDataRef.current[resolution]?.volumeData || {}),
              ...result.volumeData,
            },
            latestTime,
          },
        };
        chartDataRef.current = updatedChartData;

        // If the number of elements fetched < `MAX_ELEMENTS_PER_FETCH`
        // then wait for `UPDATE_FEED_INTERVAL` milliseconds before fetching again.
        if (numElements < MAX_ELEMENTS_PER_FETCH) {
          // Update the chart if there is any new data.
          if (!result.allDuplicates) {
            setChartDataDictionary(chartDataRef.current);
          }
          const schedulerID = setTimeout(
            () =>
              schedulerLoop(
                chartDataRef.current[resolution]?.latestTime ||
                  scaledInitialStart,
              ),
            UPDATE_FEED_INTERVAL,
          ) as unknown as number;
          schedulers.current.push(schedulerID);
          return schedulerID;
        } else {
          // We fetched MAX_ELEMENTS_PER_FETCH elements, so only wait
          // `FETCH_INTERVAL` milliseconds.
          const schedulerID = setTimeout(
            () =>
              schedulerLoop(
                chartDataRef.current[resolution]?.latestTime ||
                  scaledInitialStart,
              ),
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
    schedulerLoop(scaledInitialStart).then((schedulerID) => {
      schedulers.current.push(schedulerID);
    });

    return () => {
      // Clear all schedulers when the component unmounts.
      schedulers.current.forEach(clearTimeout);
      schedulers.current = [];
    };
  }, [resolution, selectedMarket]);

  return chartDataDictionary[resolution];
}
