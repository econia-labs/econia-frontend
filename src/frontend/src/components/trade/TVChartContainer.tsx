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

type TVChartContainerProps = {
  selectedMarket: ApiMarket;
  allMarketData: ApiMarket[];
};

async function fetchData(
  start: Date,
  end: Date,
  marketId: number,
  resolution: string,
  selectedMarket: ApiMarket,
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

  const priceData = data.map((bar) => ({
    time: new Date(bar.start_time).getTime() / 1000,
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
  }));

  const volumeData = data.map((bar) => ({
    time: new Date(bar.start_time).getTime() / 1000,
    value: bar.volume,
    color: bar.close > bar.open ? RED_OPACITY_HALF : GREEN_OPACITY_HALF,
  }));

  return { priceData, volumeData };
}

export const TVChartContainer: React.FC<
  Partial<ChartContainerProps> & TVChartContainerProps
> = (props) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Guard clause to exit early if the ref isn't attached to an element yet
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
      priceScaleId: "",
    });

    const START_DAYS_AGO = 25;
    const END_DAYS_AGO = 15;
    const now = new Date();
    const start = new Date(now - START_DAYS_AGO * MS_IN_ONE_DAY);
    const end = new Date(now - END_DAYS_AGO * MS_IN_ONE_DAY);
    const resolution = "60";

    fetchData(
      start,
      end,
      props.selectedMarket.market_id,
      resolution,
      props.selectedMarket,
    ).then((result) => {
      candlestickSeries.setData(result.priceData);
      volumeSeries.setData(result.volumeData);
    });

    chart.priceScale("").applyOptions({
      scaleMargins: {
        top: 0.9,
        bottom: 0,
      },
    });

    return () => {
      chart.remove();
    };
  }, [props.symbol, props.selectedMarket]);

  return (
    <div className="relative w-full">
      <div className="absolute left-0 top-0 flex h-full w-full animate-fadeIn items-center justify-center text-center font-roboto-mono text-sm font-light leading-6 text-neutral-500 opacity-0 delay-[2000]">
        <div>
          The mobile wallet you are using does not support candlesticks. Please
          use a different mobile wallet
        </div>
      </div>
      <div ref={chartContainerRef} className="relative h-full w-full"></div>
    </div>
  );
};
