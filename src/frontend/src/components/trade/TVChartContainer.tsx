// @ts-nocheck
import { ColorType, createChart } from "lightweight-charts";
import { useEffect, useRef } from "react";

import { API_URL } from "@/env";
import { type ApiMarket } from "@/types/api";
import { toDecimalPrice } from "@/utils/econia";

const DAY_BY_RESOLUTION: { [key: string]: string } = {
  "1D": "86400",
  "30": "1800",
  "60": "3600",
  "15": "900",
  "240": "14400",
  "3D": "43200",
  "5": "300",
  "1": "60",
};
const MS_IN_ONE_DAY = 24 * 60 * 60 * 1000;
export interface ChartContainerProps {
  symbol: string;
}

const GREEN = "rgba(110, 213, 163, 1.0)";
const RED = "rgba(240, 129, 129, 1.0)";

const GREEN_OPACITY_HALF = "rgba(110, 213, 163, 0.5)";
const RED_OPACITY_HALF = "rgba(240, 129, 129, 0.5)";

const START_DAYS_AGO = 1;
const MAX_ELEMENTS_PER_FETCH = 100;

// Time intervals in milliseconds.
const UPDATE_FEED_INTERVAL = 10000;
const FETCH_INTERVAL = 10;

// Used as a key for DAY_BY_RESOLUTION to get the resolution in seconds.
const RESOLUTION = "5";

type TVChartContainerProps = {
  selectedMarket: ApiMarket;
  allMarketData: ApiMarket[];
};

async function fetchData(
  start: Date,
  end: Date,
  marketId: number,
  selectedMarket: ApiMarket,
) {
  const url = new URL(
    `/candlesticks?${new URLSearchParams({
      market_id: `eq.${marketId}`,
      resolution: `eq.${DAY_BY_RESOLUTION[RESOLUTION]}`,
      and:
        `(start_time.lte.${end.toISOString()},` +
        `start_time.gte.${start.toISOString()})`,
    })}`,
    API_URL,
  ).href;

  const res = await fetch(url);
  const data = await res.json();
  let latestTime = start;

  const priceData = data.map((bar) => {
    const barTime = new Date(bar.start_time);
    latestTime = latestTime >= barTime ? latestTime : barTime;
    return {
      time: barTime.getTime() / 1000,
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
  });

  const volumeData = data.map((bar) => ({
    time: new Date(bar.start_time).getTime() / 1000,
    value: toDecimalPrice({
      price: bar.volume,
      marketData: selectedMarket,
    }).toNumber(),
    color: bar.close > bar.open ? RED_OPACITY_HALF : GREEN_OPACITY_HALF,
  }));

  return { priceData, volumeData, latestTime };
}

export const TVChartContainer: React.FC<
  Partial<ChartContainerProps> & TVChartContainerProps
> = (props) => {
  // `shouldFetchRef` is used to control the fetch loop, we use a ref to avoid
  // a dependency cycle that results in an infinite re-render loop.
  const shouldFetchRef = useRef<boolean>(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Since the `lightweight-charts` library doesn't use the `getBars(...)` function
  // with a custom datafeed, we need to provide our own form of pagination to fetch
  // historical data.
  // In order to avoid blocking the main thread with a while loop, we use
  // `setTimeout(() => loop(...), interval)` as an asynchronous scheduling mechanism to
  // fetch data at regular intervals.
  // If the data has not been fetched completely, we loop very quickly until the number
  // of elements fetched is less than `MAX_ELEMENTS_PER_FETCH`. Otherwise, we wait for
  // a longer amount of time to try to fetch more data.
  const startFetchLoop = async (
    start: Date,
    chart,
    candlestickSeries,
    volumeSeries,
    selectedMarket: ApiMarket,
  ) => {
    const loop = async (isInitialFetch: boolean, start: Date) => {
      if (shouldFetchRef.current) {
        const now = new Date();

        const result = await fetchData(
          start,
          now,
          selectedMarket.market_id,
          selectedMarket,
        );

        result.priceData.forEach((bar) => {
          candlestickSeries.update(bar);
        });
        result.volumeData.forEach((bar) => {
          volumeSeries.update(bar);
        });

        // If we are still fetching the initial data, fit the content to the
        // container every time we receive more chart data.
        if (isInitialFetch) {
          chart.timeScale().fitContent();
        }

        const numElements = result.priceData.length;
        const latestTime = result.latestTime;

        // If the number of elements fetched is less than `MAX_ELEMENTS_PER_FETCH`
        // then wait for `UPDATE_FEED_INTERVAL` milliseconds before fetching again.
        if (numElements < MAX_ELEMENTS_PER_FETCH) {
          // Note that we no longer automatically resize the chart after this
          // by passing `isInitialFetch` as `false` to `loop`.
          setTimeout(() => loop(false, latestTime), UPDATE_FEED_INTERVAL);
          // Otherwise, fetch again after `FETCH_INTERVAL` milliseconds.
        } else {
          setTimeout(() => loop(isInitialFetch, latestTime), FETCH_INTERVAL);
        }
      }
    };

    loop(true, start);
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#ffffff",
      },
      autoSize: true,
      grid: {
        vertLines: {
          color: "rgba(197, 203, 206, 0.1)",
        },
        horzLines: {
          color: "rgba(197, 203, 206, 0.1)",
        },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: GREEN,
      downColor: RED,
      borderUpColor: GREEN,
      borderDownColor: RED,
      wickUpColor: GREEN,
      wickDownColor: RED,
      borderVisible: false,
      wickVisible: true,
    });

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "id_volume",
    });

    chart.priceScale("id_volume").applyOptions({
      scaleMargins: {
        top: 0.9,
        bottom: 0,
      },
    });
    chart.timeScale().applyOptions({
      leftOffset: 0,
      rightOffset: 0,
      secondsVisible: true,
      ticksVisible: true,
      timeVisible: true,
    });

    window.addEventListener("resize", () => {
      chart.timeScale().fitContent();
    });

    const now = new Date();
    const start = new Date(now - START_DAYS_AGO * MS_IN_ONE_DAY);
    shouldFetchRef.current = true;
    startFetchLoop(
      start,
      chart,
      candlestickSeries,
      volumeSeries,
      props.selectedMarket,
    );

    return () => {
      // Remove the chart and end the fetch loop
      // scheduler if the component is unmounted.
      chart.remove();
      shouldFetchRef.current = false;
    };
  }, [props.symbol, props.selectedMarket]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-0 top-0 flex h-full w-full animate-fadeIn items-center justify-center text-center font-roboto-mono text-sm font-light leading-6 text-neutral-500 opacity-0 delay-[2000]">
        <div>
          The mobile wallet you are using does not support candlesticks. Please
          use a different mobile wallet
        </div>
      </div>
      <div ref={chartContainerRef} className="absolute inset-0"></div>
    </div>
  );
};
