import { ColorType, createChart } from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

import { type DAY_BY_RESOLUTION, useChartData } from "@/hooks/useChartData";
import { type ApiMarket } from "@/types/api";

import ResolutionSelector from "./ResolutionSelector";

export const GREEN = "rgba(110, 213, 163, 1.0)";
export const RED = "rgba(240, 129, 129, 1.0)";

export const GREEN_OPACITY_HALF = "rgba(110, 213, 163, 0.5)";
export const RED_OPACITY_HALF = "rgba(240, 129, 129, 0.5)";
export interface ChartContainerProps {
  symbol: string;
}

export type TVChartContainerProps = {
  selectedMarket: ApiMarket;
  allMarketData: ApiMarket[];
};

export const TVChartContainer: React.FC<
  Partial<ChartContainerProps> & TVChartContainerProps
> = (props) => {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const chartAPIRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  /* eslint-enable  @typescript-eslint/no-explicit-any */

  const chartComponentRef = useRef<HTMLDivElement>(null);
  const [resolution, setResolution] = useState<keyof typeof DAY_BY_RESOLUTION>(
    "5" as keyof typeof DAY_BY_RESOLUTION,
  );
  const chartData = useChartData(resolution, props.selectedMarket);

  useEffect(() => {
    if (
      chartData &&
      chartComponentRef.current &&
      chartAPIRef.current &&
      candlestickSeriesRef.current &&
      volumeSeriesRef.current
    ) {
      const priceData = Object.values(chartData.priceData);
      const volumeData = Object.values(chartData.volumeData);

      const prevNumBars = candlestickSeriesRef.current.data().length;
      candlestickSeriesRef.current.setData(priceData);
      volumeSeriesRef.current.setData(volumeData);
      const currNumBars = candlestickSeriesRef.current.data().length;
      if (prevNumBars !== currNumBars) {
        chartAPIRef.current.timeScale().fitContent();
      }
    }
  }, [chartData]);

  // Initialization useEffect hook to create the chart with both a price and
  // volume candlestick series.
  useEffect(() => {
    if (!chartComponentRef.current) return;

    const chart = createChart(chartComponentRef.current, {
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

    candlestickSeriesRef.current = chart.addCandlestickSeries({
      upColor: GREEN,
      downColor: RED,
      borderUpColor: GREEN,
      borderDownColor: RED,
      wickUpColor: GREEN,
      wickDownColor: RED,
      borderVisible: false,
      wickVisible: true,
    });

    volumeSeriesRef.current = chart.addHistogramSeries({
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
      secondsVisible: true,
      ticksVisible: true,
      timeVisible: true,
    });

    window.addEventListener("resize", () => {
      chart.timeScale().fitContent();
    });

    chartAPIRef.current = chart;

    // Subscribe to logical range changes so that when the user zooms out
    // too far, we reset the logical range back to the maximum.
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) {
        const numBars = candlestickSeriesRef.current.data().length;
        const margin = numBars * 0.1;

        if (range.from < 0 - margin || range.to > numBars + margin) {
          const newFrom = Math.max(range.from, 0 - margin);
          const newTo = Math.min(range.to, numBars + margin);
          chart.timeScale().setVisibleLogicalRange({
            from: newFrom < newTo ? newFrom : 0,
            to: newTo > newFrom ? newTo : numBars,
          });
        }
      }
    });

    return () => {
      // Remove the chart and end the fetch loop
      // scheduler if the component is unmounted.
      chart.remove();
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
      <div ref={chartComponentRef} className="absolute inset-0" />
      <ResolutionSelector
        resolution={resolution}
        setResolution={setResolution}
      />
    </div>
  );
};
