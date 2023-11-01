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
  "12H",
  "1D",
] as ResolutionString[];

const resolutionMap: Record<string, ApiResolution> = {
  "1": "1m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "4H": "4h",
  "12H": "12h",
  "1D": "1d",
};

type DataStatus = "streaming" | "endofday" | "pulsed" | "delayed_streaming";

const configurationData: DatafeedConfiguration = {
  supported_resolutions: resolutions,
  exchanges: [
    // {
    //   value: "Pontem",
    //   name: "Pontem",
    //   desc: "pontem",
    // },
    {
      value: "bitfinex",
      name: "Bitfinex",
      desc: "Bitfinex",
    },
    {
      value: "Kraken",
      // Filter name
      name: "Kraken",
      // Full exchange name displayed in the filter popup
      desc: "Kraken bitcoin exchange",
    },
  ],
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
  const data = await makeApiRequest(`api/v3/exchanges/${exchange}/tickers`);
  let allSymbols: any[] = [];
  const tickers = data?.tickers || [];
  const symbols = (tickers as APITickerExchange[]).map((item) => {
    const symbol = generateSymbol(exchange, item.base, item.target);
    return {
      symbol: symbol.short,
      full_name: symbol.full,
      description: symbol.short,
      exchange: exchange,
      target: item.target,
      type: "crypto",
    };
  });

  allSymbols = [...allSymbols, ...symbols];
  return allSymbols;
}

type TVChartContainerProps = {
  selectedMarket: MarketData | ApiMarket;
  allMarketData: MarketData[] | ApiMarket[];
};

const lastBarsCache = new Map();
const STEP: { [key: string]: number } = {
  "1D": 86400000,
  "30": 30 * 60 * 1000,
};
export const TVChartContainer: React.FC<
  Partial<ChartContainerProps> & TVChartContainerProps
> = (props) => {
  const tvWidget = useRef<IChartingLibraryWidget>();
  const ref = useRef<HTMLDivElement>(null);

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
        // const currencySupport = await getAllCurrency();
        const symbols = await getAllSymbols(exchange);
        const newSymbols = symbols.filter((symbol) => {
          const isExchangeValid =
            exchange === "" || symbol.exchange === exchange;
          const isFullSymbolContainsInput =
            symbol.full_name.toLowerCase().indexOf(userInput.toLowerCase()) !==
            -1;
          // const isCurrencySupport = currencySupport.includes(
          //   symbol.target.toLowerCase(),
          // );
          return isExchangeValid && isFullSymbolContainsInput;
        });
        onResultReadyCallback(newSymbols);
      },
      resolveSymbol: async (
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback,
        extension,
      ) => {
        const [exchange, symbolValue] = symbolName.split(":");
        const symbols = await getAllSymbols(exchange);
        const symbolItem = symbols.find(
          ({ full_name }) => full_name === symbolName,
        );
        if (!symbolItem) {
          onResolveErrorCallback("cannot resolve symbol");
          return;
        }
        // Symbol information object
        const symbolInfo = {
          ticker: symbolItem.full_name,
          full_name: symbolItem.full_name,
          listed_exchange: symbolItem.exchange,
          format: "price" as SeriesFormat,
          name: symbolItem.symbol,
          description: symbolItem.description,
          type: symbolItem.type,
          session: "24x7",
          timezone:
            (Intl.DateTimeFormat().resolvedOptions().timeZone as Timezone) ??
            "Etc/UTC",
          exchange: symbolItem.exchange,
          minmov: 1,
          pricescale: 100,
          has_intraday: false,
          has_no_volume: true,
          has_weekly_and_monthly: false,
          visible_plots_set: "ohlcv" as VisiblePlotsSet,
          supported_resolutions: configurationData.supported_resolutions || [],
          volume_precision: 2,
          data_status: "streaming" as DataStatus,
        };

        onSymbolResolvedCallback(symbolInfo);
      },
      getBars: async (
        symbolInfo,
        resolution,
        periodParams,
        onHistoryCallback,
        onErrorCallback,
      ) => {
        const { from, to, firstDataRequest } = periodParams;
        console.log(
          "🚀 ~ file: TVChartContainer.tsx:224 ~ from:",
          from,
          to,
          new Date(from * 1000),
          new Date(to * 1000),
        );
        const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
        // const currency = parsedSymbol?.toSymbol.toLowerCase() as string;
        // const coinID = symbolInfo.description.split("/")[0].toLowerCase();
        // const urlParameters = {
        //   vs_currency:
        //     currency == "usdt" || currency == "usdc" ? "usd" : currency,
        //   days: "365",
        // } as any;
        // const query = Object.keys(urlParameters)
        //   .map((name) => `${name}=${encodeURIComponent(urlParameters[name])}`)
        //   .join("&");
        const urlParameters = {
          e: parsedSymbol?.exchange,
          fsym: parsedSymbol?.fromSymbol,
          tsym: parsedSymbol?.toSymbol,
          toTs: to,
          limit: 500,
        } as any;

        const query = Object.keys(urlParameters)
          .map((name) => `${name}=${encodeURIComponent(urlParameters[name])}`)
          .join("&");

        try {
          // const data = await makeApiRequest(
          //   `api/v3/coins/${coinID}/ohlc?${query}`,
          // );
          // const data = await makeApiRequestMin(`data/histoday?${query}`);
          const res = await fetch(
            new URL(
              `/api/v3/coins/aptos/ohlc?${new URLSearchParams({
                vs_currency: "usd",
                days: "365",
              })}`,
              "https://api.coingecko.com",
            ).href,
          );
          const data = await res.json();
          if (data.length < 1) {
            onHistoryCallback([], {
              noData: true,
            });
            return;
          }
          const stepInterval = STEP[resolution];

          const bars: Bar[] = data
            .map(
              (
                bar: [number, number, number, number, number],
                index: number,
              ): Bar => ({
                time: from * 1000 + index * 86400000,
                open: bar[1],
                high: bar[2],
                low: bar[3],
                close: bar[4],
              }),
            )
            .filter(
              (bar: Bar) => bar.time >= from * 1000 && bar.time <= to * 1000,
            );
          if (bars.length === 0) {
            bars.push(
              {
                time: from * 1000,
                open: 0,
                close: 0,
                high: 0,
                low: 0,
              }
            )
          }

          while (bars[0].time > from * 1000) {
            bars.unshift({
              time: bars[0].time - stepInterval,
              open: 0,
              close: 0,
              high: 0,
              low: 0,
            });
          }

          while (bars[bars.length - 1].time < to * 1000 - stepInterval) {
            bars.push({
              time: bars[bars.length - 1].time + stepInterval,
              open: 0,
              close: 0,
              high: 0,
              low: 0,
            });
          }

          if (firstDataRequest) {
            lastBarsCache.set(symbolInfo.full_name, {
              ...bars[bars.length - 1],
            });
          }
          console.log("bars", bars);

          console.log(`[getBars]: returned ${bars.length} bar(s)`);
          onHistoryCallback(bars, {
            noData: false,
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
    [],
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
