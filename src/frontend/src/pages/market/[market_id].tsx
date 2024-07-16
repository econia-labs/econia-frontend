import type { GetStaticPaths, GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import Script from "next/script";
import React, { useEffect, useMemo, useState } from "react";

import { DepthChart } from "@/components/DepthChart";
import { Header } from "@/components/Header";
import { DepositWithdrawFlowModal } from "@/components/modals/flows/DepositWithdrawFlowModal";
import { WalletButtonFlowModal } from "@/components/modals/flows/WalletButtonFlowModal";
import { OrderbookTable } from "@/components/OrderbookTable";
import { StatsBar } from "@/components/StatsBar";
import MobileOrderEntry from "@/components/trade/MobileOrderEntry";
import { OrderEntry } from "@/components/trade/OrderEntry";
import { OrdersTable } from "@/components/trade/OrdersTable";
import { TradeHistoryTable } from "@/components/trade/TradeHistoryTable";
import { OrderEntryContextProvider } from "@/contexts/OrderEntryContext";
import { useOrderBook } from "@/hooks/useOrderbook";
import type { ApiMarket } from "@/types/api";
import { getAllMarket } from "@/utils/helpers";

type Props = {
  marketData: ApiMarket;
  allMarketData: ApiMarket[];
};

type PathParams = {
  market_id: string;
};
export interface ChartContainerProps {
  symbol: string;
}

export interface TVChartContainerProps {
  selectedMarket: ApiMarket;
  allMarketData: ApiMarket[];
}

let ChartContainer = dynamic(
  () => {
    try {
      // We call `require` here for the private charting library before
      // to facilitate SSR with a fallback to the lightweight library.
      // If the import fails, the `catch` block is executed and we
      // load the `LightweightChartsContainer` instead.
      // If the library is present, the TVChartContainer component will
      // be used, and it will load the `charting_library` module from the
      // cache with its `require(...)`.
      //
      // NOTE: We must use `require` here instead of a dynamic `import`
      // to circumvent the SSR build process failing due to an invalid path.
      // With `import` the provided path is statically resolved at build time
      // whereas with `require`, path resolution is deferred until runtime and can
      // thus be conditionally resolved within a `try/catch` block.
      require("../../../public/static/charting_library");
      return import("@/components/trade/TVChartContainer").then(
        (mod) => mod.TVChartContainer,
      );
    } catch (e) {
      console.warn("\nFailed to load `charting_library`.");
      console.warn("Using `lightweight-charts` instead...");
      return import("@/components/trade/LightweightChartsContainer").then(
        (mod) => mod.LightweightChartsContainer,
      );
    }
  },
  { ssr: true },
);

export default function Market({ allMarketData, marketData }: Props) {
  const router = useRouter();

  const [tab, setTab] = useState<"orders" | "order-book" | "trade-histories">(
    "orders",
  );
  const [depositWithdrawModalOpen, setDepositWithdrawModalOpen] =
    useState<boolean>(false);
  const [walletButtonModalOpen, setWalletButtonModalOpen] =
    useState<boolean>(false);

  const [isScriptReady, setIsScriptReady] = useState(false);

  useEffect(() => {
    if (router.query.lwc === "true") {
      // NOTE: We may have already loaded the private charting library, but this is a feature
      // for testing and debugging, so we don't need to check if the library is already loaded.
      console.warn(
        "Force loading LightweightChartsContainer. Avoid loading both libraries in production.",
      );
      // In a production app, you should load one or the other.
      ChartContainer = dynamic(async () =>
        import("@/components/trade/LightweightChartsContainer").then(
          (mod) => mod.LightweightChartsContainer,
        ),
      );
    }
  }, [router.query]);

  useEffect(() => {
    const f = () => {
      const LG = 768;
      if (window.innerWidth > LG) {
        setTab("orders");
      }
    };
    window.addEventListener("resize", f);

    return () => window.removeEventListener("resize", f);
  }, []);

  const {
    data: orderbookData,
    isFetching: orderbookIsFetching,
    isLoading: orderbookIsLoading,
  } = useOrderBook(marketData?.market_id ?? 0);

  const defaultTVChartProps = useMemo(() => {
    return {
      symbol: `${marketData?.name ?? ""}`,
      selectedMarket: marketData as ApiMarket,
      allMarketData: allMarketData as ApiMarket[],
    };
  }, [marketData, allMarketData]);

  if (!allMarketData) {
    return <>Loading...</>;
  }

  if (!marketData)
    return (
      <>
        <Head>
          <title>Not Found</title>
        </Head>
        <div className="flex min-h-screen flex-col">
          <Header logoHref={`${allMarketData[0]?.market_id}`} />
          Market not found.
        </div>
      </>
    );

  return (
    <OrderEntryContextProvider>
      <Head>
        <title>{`${marketData.name} | Econia`}</title>
      </Head>
      <div className="scrollbar-none flex h-screen flex-col">
        <Header
          logoHref={`${allMarketData[0].market_id}`}
          onDepositWithdrawClick={() => setDepositWithdrawModalOpen(true)}
          onWalletButtonClick={() => setWalletButtonModalOpen(true)}
        />
        {isScriptReady && (
          <StatsBar allMarketData={allMarketData} selectedMarket={marketData} />
        )}
        <main className="flex h-full min-h-[680px] w-full grow flex-col gap-3 p-3 md:flex-row">
          <div className="flex flex-col gap-3 pb-0 md:w-[calc(100%-296px)] lg:w-[calc(100%-564px)]">
            <div className=" flex grow flex-col border border-neutral-600">
              <div className="flex h-full min-h-[400px] md:min-h-[unset]">
                {isScriptReady && <ChartContainer {...defaultTVChartProps} />}
              </div>

              <div className="hidden h-[140px] tall:block">
                <DepthChart marketData={marketData} />
              </div>
            </div>
            <div className="flex h-[260px] max-w-full flex-col border border-neutral-600">
              <div className="flex h-[30px] items-center gap-4 pl-4 pt-2 lg:pl-0 lg:pt-[6px]">
                <div className="flex gap-4 py-1 text-base lg:py-3 lg:pl-[17.19px]">
                  <p
                    onClick={() => setTab("orders")}
                    className={`cursor-pointer font-jost font-bold ${
                      tab === "orders" ? "text-white" : "text-neutral-600"
                    }`}
                  >
                    Orders
                  </p>
                  <p
                    onClick={() => setTab("order-book")}
                    className={`cursor-pointer font-jost font-bold lg:hidden ${
                      tab === "order-book" ? "text-white" : "text-neutral-600"
                    }`}
                  >
                    Order Book
                  </p>
                  <p
                    onClick={() => setTab("trade-histories")}
                    className={`cursor-pointer font-jost font-bold md:hidden ${
                      tab === "trade-histories"
                        ? "text-white"
                        : "text-neutral-600"
                    }`}
                  >
                    Trade History
                  </p>
                </div>
              </div>

              {tab === "orders" && (
                <OrdersTable
                  market_id={marketData.market_id}
                  marketData={marketData}
                />
              )}
              {tab === "trade-histories" && (
                <div className="h-full overflow-hidden">
                  <TradeHistoryTable
                    marketData={marketData}
                    marketId={marketData?.market_id}
                  />
                </div>
              )}
              {tab === "order-book" && (
                <OrderbookTable
                  marketData={marketData}
                  data={orderbookData}
                  isFetching={orderbookIsFetching}
                  isLoading={orderbookIsLoading}
                />
              )}
            </div>
          </div>
          <div className="hidden w-[254px] lg:flex">
            <div className="flex w-full flex-col border border-neutral-600">
              <OrderbookTable
                marketData={marketData}
                data={orderbookData}
                isFetching={orderbookIsFetching}
                isLoading={orderbookIsLoading}
              />
            </div>
          </div>
          <div className="hidden w-[284px] flex-col md:flex">
            <div className="border border-neutral-600">
              <OrderEntry
                marketData={marketData}
                onDepositWithdrawClick={() => setDepositWithdrawModalOpen(true)}
              />
            </div>
            <div className="scrollbar-none mt-3 h-full max-h-full grid-rows-none overflow-hidden border border-neutral-600">
              <p className=" top-0 flex h-[30px] items-end bg-neutral-800 bg-noise pl-[17.03px] font-jost font-bold text-white">
                Trade History
              </p>
              <TradeHistoryTable
                marketData={marketData}
                marketId={marketData?.market_id}
              />
            </div>
          </div>
          <MobileOrderEntry
            marketData={marketData}
            onDepositWithdrawClick={() => setDepositWithdrawModalOpen(true)}
          />
        </main>
      </div>
      {/* temp */}
      <DepositWithdrawFlowModal
        selectedMarket={marketData}
        isOpen={depositWithdrawModalOpen}
        onClose={() => {
          setDepositWithdrawModalOpen(false);
        }}
        allMarketData={allMarketData}
      />
      <WalletButtonFlowModal
        selectedMarket={marketData}
        isOpen={walletButtonModalOpen}
        onClose={() => {
          setWalletButtonModalOpen(false);
        }}
        allMarketData={allMarketData}
      />
      <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="lazyOnload"
        onReady={() => {
          setIsScriptReady(true);
        }}
      />
    </OrderEntryContextProvider>
  );
}

export const getStaticPaths: GetStaticPaths<PathParams> = async () => {
  const allMarketData = await getAllMarket();
  const paths = allMarketData.map((market: ApiMarket) => ({
    params: { market_id: `${market.market_id}` },
  }));
  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) throw new Error("No params");
  const allMarketData = await getAllMarket();
  const marketData =
    allMarketData?.find(
      (market) => `${market?.market_id}` === params.market_id,
    ) || null;

  return {
    props: {
      marketData,
      allMarketData,
    },
    revalidate: 600,
  };
};
