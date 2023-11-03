import { useEffect, useMemo, useRef } from "react";

import {
  type ApiBar,
  type ApiMarket,
  type ApiResolution,
  type APITickerExchange,
  type MarketData,
} from "@/types/api";
import {
  generateSymbol,
  getClientTimezone,
  makeApiRequest,
  makeApiRequestMin,
  parseFullSymbol,
} from "@/utils/helpers";

import {
  type Bar,
  type ChartingLibraryWidgetOptions,
  type DatafeedConfiguration,
  type IBasicDataFeed,
  type IChartingLibraryWidget,
  type LibrarySymbolInfo,
  type ResolutionString,
  type SearchSymbolResultItem,
  type Timezone,
  widget,
  SeriesFormat,
  VisiblePlotsSet,
} from "../../../public/static/charting_library";
import { white } from "tailwindcss/colors";
import { API_URL } from "@/env";
import { useRouter } from "next/router";

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
type QueryParams = {
  vs_currency: string;
  days: string;
};
export interface ChartContainerProps {
  symbol: ChartingLibraryWidgetOptions["symbol"];
  interval: ChartingLibraryWidgetOptions["interval"];

  datafeedUrl: string;
  libraryPath: ChartingLibraryWidgetOptions["library_path"];
  clientId: ChartingLibraryWidgetOptions["client_id"];
  userId: ChartingLibraryWidgetOptions["user_id"];
  fullscreen: ChartingLibraryWidgetOptions["fullscreen"];
  autosize: ChartingLibraryWidgetOptions["autosize"];
  studiesOverrides: ChartingLibraryWidgetOptions["studies_overrides"];
  container: ChartingLibraryWidgetOptions["container"];
  theme: ChartingLibraryWidgetOptions["theme"];
}

const GREEN = "rgba(110, 213, 163, 1.0)";
const RED = "rgba(240, 129, 129, 1.0)";

const GREEN_OPACITY_HALF = "rgba(110, 213, 163, 0.5)";
const RED_OPACITY_HALF = "rgba(240, 129, 129, 0.5)";

const resolutions = [
  "1",
  "5",
  "15",
  "30",
  "60",
  "4H",
  // "12H",
  "1D",
] as ResolutionString[];

type DataStatus = "streaming" | "endofday" | "pulsed" | "delayed_streaming";

const configurationData: DatafeedConfiguration = {
  supported_resolutions: resolutions,
  symbols_types: [
    {
      name: "crypto",
      value: "crypto",
    },
  ],
};

async function getAllCurrency() {
  const data = await makeApiRequest(`api/v3/simple/supported_vs_currencies`);
  return data && data.map((item: string) => item.toLowerCase());
}
// Obtains all symbols for all exchanges supported by CryptoCompare API
async function getAllSymbols(exchange: string) {
  // const data = await makeApiRequest(`api/v3/exchanges/${exchange}/tickers`);
  // let allSymbols: any[] = [];
  // const tickers = data?.tickers || [];
  // const symbols = (tickers as APITickerExchange[]).map((item) => {
  //   const symbol = generateSymbol(exchange, item.base, item.target);
  //   return {
  //     symbol: symbol.short,
  //     full_name: symbol.full,
  //     description: symbol.short,
  //     exchange: exchange,
  //     target: item.target,
  //     type: "crypto",
  //   };
  // });

  // allSymbols = [...allSymbols, ...symbols];
  // return allSymbols;
  return [];
}

type TVChartContainerProps = {
  selectedMarket: MarketData | ApiMarket;
  allMarketData: MarketData[] | ApiMarket[];
};

export const TVChartContainer: React.FC<
  Partial<ChartContainerProps> & TVChartContainerProps
> = (props) => {
  const tvWidget = useRef<IChartingLibraryWidget>();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const datafeed: IBasicDataFeed = useMemo(
    () => ({
      onReady: (callback) => {
        setTimeout(() => callback(configurationData));
      },
      searchSymbols: async (
        userInput,
        exchange,
        symbolType,
        onResultReadyCallback,
      ) => {
        const symbols: SearchSymbolResultItem[] = props.allMarketData
          .map((market) => {
            return {
              description: market.name as string,
              exchange: "Econia",
              full_name: `Econia:${market.base?.symbol}`,
              symbol: market.name,
              ticker: market.name,
              type: "crypto",
            };
          })
          .filter(
            (symbol) =>
              symbol.full_name.toLowerCase().includes(userInput) ||
              symbol.symbol.toLowerCase().includes(userInput) ||
              symbol.ticker.toLowerCase().includes(userInput),
          );

        onResultReadyCallback(symbols);
      },
      resolveSymbol: async (
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback,
        extension,
      ) => {
        if (props.symbol !== symbolName) {
          router.push(`/trade/${symbolName}`);
        }
        const symbol = `${symbolName}`;
        const symbolInfo: LibrarySymbolInfo = {
          ticker: symbol,
          name: symbol,
          description: symbol,
          pricescale: 100,
          volume_precision: -Math.ceil(
            Math.log10(Number("0.00000100") * Number("100.00000000")),
          ),
          minmov: 1,
          exchange: "Econia",
          full_name: "",
          listed_exchange: "",
          session: "24x7",
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: false,
          // intraday_multipliers: configurationData.intraday_multipliers,
          timezone: getClientTimezone(),
          type: "crypto",
          supported_resolutions:
            configurationData.supported_resolutions as ResolutionString[],
          format: "price",
        };
        onSymbolResolvedCallback(symbolInfo);

        onSymbolResolvedCallback(symbolInfo);
      },
      getBars: async (
        symbolInfo,
        resolution,
        periodParams,
        onHistoryCallback,
        onErrorCallback,
      ) => {
        const { from, to } = periodParams;
        try {
          const res = await fetch(
            new URL(
              `/candlesticks?${new URLSearchParams({
                market_id: `eq.${props.selectedMarket.market_id}`,
                resolution: `eq.${DAY_BY_RESOLUTION[resolution.toString()]}`,
                and: `(start_time.lte.${new Date(
                  to * 1000,
                ).toISOString()},start_time.gte.${new Date(
                  from * 1000,
                ).toISOString()})`,
              })}`,
              API_URL,
            ).href,
          );
          const data = await res.json();
          if (data.length < 1) {
            onHistoryCallback([], {
              noData: true,
            });
            return;
          }

          const bars: Bar[] = data
            .map(
              (
                bar: {
                  start_time: string;
                  open: number;
                  close: number;
                  low: number;
                  high: number;
                  volume: number;
                },
                index: number,
              ): Bar => ({
                time: new Date(bar.start_time).getTime(),
                open: bar.open / 1000,
                high: bar.high / 1000,
                low: bar.low / 1000,
                close: bar.close / 1000,
                volume: bar.volume,
              }),
            )
            .filter(
              (bar: Bar) => bar.time >= from * 1000 && bar.time <= to * 1000,
            );
          console.log(`[getBars]: returned ${bars.length} bar(s)`);
          onHistoryCallback(bars, {
            noData: bars.length === 0,
          });
        } catch (e) {
          if (e instanceof Error) {
            console.log("[getBars]: Get error", e);
            onErrorCallback(e.message);
          }
        }
      },
      subscribeBars: async (
        _symbolInfo,
        _resolution,
        _onRealtimeCallback,
        _subscribeUID,
        _onResetCacheNeededCallback,
      ) => {
        // TODO
      },
      unsubscribeBars: async (_subscriberUID) => {
        // TODO
      },
    }),
    [props.symbol, props.allMarketData],
  );

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: props.symbol as string,
      datafeed,
      interval: "30" as ResolutionString,
      container: ref.current,
      library_path: props.libraryPath as string,
      theme: props.theme,
      locale: "en",
      custom_css_url: "/styles/tradingview.css",
      timezone:
        (Intl.DateTimeFormat().resolvedOptions().timeZone as Timezone) ??
        "Etc/UTC",
      disabled_features: [
        "use_localstorage_for_settings",
        "left_toolbar",
        "control_bar",
        "study_templates",
        "snapshot_trading_drawings",
        // "header_resolutions",
      ],
      client_id: props.clientId,
      user_id: props.userId,
      fullscreen: props.fullscreen,
      autosize: props.autosize,
      loading_screen: { backgroundColor: "#000000" },
      overrides: {
        "paneProperties.backgroundType": "solid",
        "paneProperties.background": "#000000",
        "scalesProperties.backgroundColor": "#000000",
        "mainSeriesProperties.barStyle.upColor": GREEN,
        "mainSeriesProperties.barStyle.downColor": RED,
        "mainSeriesProperties.candleStyle.upColor": GREEN,
        "mainSeriesProperties.candleStyle.downColor": RED,
        "mainSeriesProperties.candleStyle.borderUpColor": GREEN,
        "mainSeriesProperties.candleStyle.borderDownColor": RED,
        "mainSeriesProperties.candleStyle.wickUpColor": GREEN,
        "mainSeriesProperties.candleStyle.wickDownColor": RED,
        "mainSeriesProperties.columnStyle.upColor": GREEN_OPACITY_HALF,
        "mainSeriesProperties.columnStyle.downColor": RED_OPACITY_HALF,
        "mainSeriesProperties.hollowCandleStyle.upColor": GREEN,
        "mainSeriesProperties.hollowCandleStyle.downColor": RED,
        "mainSeriesProperties.rangeStyle.upColor": GREEN,
        "mainSeriesProperties.rangeStyle.downColor": RED,
        "paneProperties.legendProperties.showVolume": true,
      },
      studies_overrides: {
        ...props.studiesOverrides,
        "volume.volume.color.0": RED_OPACITY_HALF,
        "volume.volume.color.1": GREEN_OPACITY_HALF,
      },
      time_frames: [
        // defaults
        {
          text: "1D",
          resolution: "1" as ResolutionString,
        },
        {
          text: "5D",
          resolution: "5" as ResolutionString,
        },
        {
          text: "1M",
          resolution: "30" as ResolutionString,
        },
        {
          text: "3M",
          resolution: "60" as ResolutionString,
        },
        {
          text: "6M",
          resolution: "120" as ResolutionString,
        },
        {
          text: "1y",
          resolution: "D" as ResolutionString,
        },
        {
          text: "5y",
          resolution: "W" as ResolutionString,
        },
        {
          text: "1000y", // custom ALL timeframe
          resolution: "1" as ResolutionString, // may want to specify a different resolution here for server load purposes
          description: "All",
          title: "All",
        },
      ],
    };

    tvWidget.current = new widget(widgetOptions);

    return () => {
      console.log("reject");
      if (tvWidget.current != null) {
        tvWidget.current.remove();
        tvWidget.current = undefined;
      }
    };
  }, [
    datafeed,
    props.symbol,
    props.clientId,
    props.userId,
    props.fullscreen,
    props.autosize,
    props.studiesOverrides,
    props.theme,
    props.libraryPath,
  ]);

  return <div ref={ref} className="w-full" />;
};
