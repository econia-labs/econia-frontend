import { ColorType, createChart, type LogicalRange } from "lightweight-charts";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_PRICE_AXIS_WIDTH,
  GREEN,
  RED,
  VOLUME_PRICE_CHART_ID,
} from "@/constants";
import { type DAY_BY_RESOLUTION, useChartData } from "@/hooks/useChartData";
import {
  type ChartContainerProps,
  type TVChartContainerProps,
} from "@/pages/market/[market_id]";

import ResizeChartButton from "./ResizeChartButton";
import ResolutionSelector from "./ResolutionSelector";

export const LightweightChartsContainer: React.FC<
  Partial<ChartContainerProps> & TVChartContainerProps
> = (props) => {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const chartAPIRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const chartIsInitialized = useRef(false);
  /* eslint-enable  @typescript-eslint/no-explicit-any */

  const chartComponentRef = useRef<HTMLDivElement>(null);
  const [resolution, setResolution] = useState<keyof typeof DAY_BY_RESOLUTION>(
    "5" as keyof typeof DAY_BY_RESOLUTION,
  );
  const chartData = useChartData(resolution, props.selectedMarket);
  const dragging = useRef(false);

  const [priceScaleWidth, setPriceScaleWidth] = useState(
    DEFAULT_PRICE_AXIS_WIDTH,
  );

  const resizeChart = useCallback(() => {
    const chart = chartAPIRef.current;
    if (chart && chartIsInitialized.current) {
      // The ID of the price scale is automatically set to "right"
      // because it doesn't have an ID otherwise. This is not
      // documented in the TradingView API.
      // We set `autoScale` to `true` here because if the user previously
      // manually adjusted the priceScale, `autoScale` will be turned off.
      chart.priceScale("right").applyOptions({ autoScale: true });
      chart.priceScale(VOLUME_PRICE_CHART_ID).applyOptions({ autoScale: true });
      chart.timeScale().fitContent();
      // We use requestAnimationFrame to try to ensure that the API has updated
      // the priceScale width internally before we set the state.
      requestAnimationFrame(() => {
        setPriceScaleWidth(chart.priceScale("right").width());
      });
    }
  }, []);

  useEffect(() => {
    if (
      chartData &&
      chartComponentRef.current &&
      chartAPIRef.current &&
      candlestickSeriesRef.current &&
      volumeSeriesRef.current &&
      chartIsInitialized.current
    ) {
      const priceData = Object.values(chartData.priceData);
      const volumeData = Object.values(chartData.volumeData);

      const prevNumBars = candlestickSeriesRef.current.data().length;
      candlestickSeriesRef.current.setData(priceData);
      volumeSeriesRef.current.setData(volumeData);
      const currNumBars = candlestickSeriesRef.current.data().length;

      if (prevNumBars !== currNumBars) {
        resizeChart();
      }
    }
  }, [chartData, resizeChart]);

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
      priceScaleId: VOLUME_PRICE_CHART_ID,
    });

    chart.priceScale(VOLUME_PRICE_CHART_ID).applyOptions({
      scaleMargins: {
        top: 0.9,
        bottom: 0,
      },
      autoScale: true,
      minimumWidth: DEFAULT_PRICE_AXIS_WIDTH,
    });
    chart.timeScale().applyOptions({
      secondsVisible: true,
      ticksVisible: true,
      timeVisible: true,
    });

    chartAPIRef.current = chart;

    const windowFitContentForResize = () => {
      chart.timeScale().fitContent();
    };

    window.addEventListener("resize", windowFitContentForResize);

    // Subscribe to logical range changes so that when the user zooms out
    // too far, we reset the logical range back to the maximum.
    const rangeChangeHandler = (range: LogicalRange | null) => {
      if (range && !dragging.current) {
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
      setPriceScaleWidth(chart.priceScale("right").width());
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(rangeChangeHandler);
    chartIsInitialized.current = true;
    return () => {
      window.removeEventListener("resize", windowFitContentForResize);
      // Remove the chart and end the fetch loop
      // scheduler if the component is unmounted.
      chart
        .timeScale()
        .unsubscribeVisibleLogicalRangeChange(rangeChangeHandler);
      chart.remove();
      chartIsInitialized.current = false;
    };
  }, [props.symbol, props.selectedMarket]);

  // Track whether the user is dragging the mouse on the chart.
  useEffect(() => {
    const chartComponent = chartComponentRef.current;

    if (chartComponent) {
      const handleMouseDown = () => {
        dragging.current = true;
      };
      const handleMouseUp = () => {
        dragging.current = false;
      };

      // We listen to mouseup events on the window because the user might
      // drag the mouse outside of the chart component.
      chartComponent.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        chartComponent.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, []);

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
      <ResizeChartButton
        handleClick={resizeChart}
        priceScaleWidth={priceScaleWidth}
      />
    </div>
  );
};
