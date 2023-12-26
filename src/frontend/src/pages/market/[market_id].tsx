import type { GetStaticPaths, GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
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

import {
  type ResolutionString,
  type ThemeName,
} from "../../../public/static/charting_library";

const TVChartContainer = dynamic(
  () =>
    import("@/components/trade/TVChartContainer").then(
      (mod) => mod.TVChartContainer,
    ),
  { ssr: false },
);

type Props = {
  marketData: ApiMarket;
  allMarketData: ApiMarket[];
};

type PathParams = {
  market_id: string;
};

export default function Market({ allMarketData, marketData }: Props) {
  const [tab, setTab] = useState<"orders" | "order-book" | "trade-histories">(
    "orders",
  );
  const [depositWithdrawModalOpen, setDepositWithdrawModalOpen] =
    useState<boolean>(false);
  const [walletButtonModalOpen, setWalletButtonModalOpen] =
    useState<boolean>(false);

  const [isScriptReady, setIsScriptReady] = useState(false);

  // Set up WebSocket API connection
  // useEffect(() => {
  //   ws.current = new WebSocket(WS_URL);
  //   ws.current.onopen = () => {
  //     // because useEffects can fire more than once and onopen is an async function, we still want to check readystate when we send a message
  //     if (
  //       marketData?.market_id == null ||
  //       ws.current == null ||
  //       ws.current.readyState !== WebSocket.OPEN
  //     ) {
  //       return;
  //     }

  //     // Subscribe to orderbook price level updates
  //     ws.current.send(
  //       JSON.stringify({
  //         method: "subscribe",
  //         channel: "price_levels",
  //         params: {
  //           market_id: marketData.market_id,
  //         },
  //       }),
  //     );
  //   };

  //   // Close WebSocket connection on page close
  //   return () => {
  //     if (ws.current != null) {
  //       ws.current.close();
  //     }
  //   };
  // }, [marketData?.market_id]);

  // Handle wallet connect and disconnect
  // useEffect(() => {
  //   if (
  //     marketData?.market_id == null ||
  //     ws.current == null ||
  //     ws.current.readyState !== WebSocket.OPEN
  //   ) {
  //     return;
  //   }
  //   if (account?.address != null) {
  //     //  commenting this out because it doesn't seem to be doing what it's supposed to
  //     //  maybe if we made it synchronous it would work?

  //     // If the WebSocket connection is not ready,
  //     // wait for the WebSocket connection to be opened.
  //     // if (ws.current.readyState === WebSocket.CONNECTING) {
  //     //   const interval = setInterval(() => {
  //     //     if (ws.current?.readyState === WebSocket.OPEN) {
  //     //       clearInterval(interval);
  //     //     }
  //     //   }, 500);
  //     // }

  //     // Subscribe to orders by account channel
  //     ws.current.send(
  //       JSON.stringify({
  //         method: "subscribe",
  //         channel: "orders",
  //         params: {
  //           market_id: marketData.market_id,
  //           user_address: account.address,
  //         },
  //       }),
  //     );

  //     // Subscribe to fills by account channel
  //     ws.current.send(
  //       JSON.stringify({
  //         method: "subscribe",
  //         channel: "fills",
  //         params: {
  //           market_id: marketData.market_id,
  //           user_address: account.address,
  //         },
  //       }),
  //     );

  //     // Store address for unsubscribing when wallet is disconnected.
  //     prevAddress.current = account.address;
  //   } else {
  //     if (prevAddress.current != null) {
  //       // Unsubscribe to orders by account channel
  //       ws.current.send(
  //         JSON.stringify({
  //           method: "unsubscribe",
  //           channel: "orders",
  //           params: {
  //             market_id: marketData.market_id,
  //             user_address: prevAddress.current,
  //           },
  //         }),
  //       );

  //       // Unsubscribe to fills by account channel
  //       ws.current.send(
  //         JSON.stringify({
  //           method: "unsubscribe",
  //           channel: "fills",
  //           params: {
  //             market_id: marketData.market_id,
  //             user_address: prevAddress.current,
  //           },
  //         }),
  //       );

  //       // Clear saved address
  //       prevAddress.current = undefined;
  //     }
  //   }
  // }, [marketData?.market_id, account?.address]);

  // Handle incoming WebSocket messages
  // useEffect(() => {
  //   if (marketData?.market_id == null || ws.current == null) {
  //     return;
  //   }

  //   ws.current.onmessage = (message) => {
  //     const msg = JSON.parse(message.data);

  //     if (msg.event === "update") {
  //       if (msg.channel === "orders") {
  //         const { order_status, market_order_id }: ApiOrder = msg.data;
  //         switch (order_status) {
  //           // TODO further discuss what toast text should be
  //           case "open":
  //             toast.success(
  //               `Order with order ID ${market_order_id} placed successfully.`,
  //             );
  //             break;
  //           case "filled":
  //             toast.success(`Order with order ID ${market_order_id} filled.`);
  //             break;
  //           case "cancelled":
  //             toast.warn(`Order with order ID ${market_order_id} cancelled.`);
  //             break;
  //           case "evicted":
  //             toast.warn(`Order with order ID ${market_order_id} evicted.`);
  //             break;
  //         }
  //       } else if (msg.channel === "price_levels") {
  //         const priceLevel: ApiPriceLevel = msg.data;
  //         queryClient.setQueriesData(
  //           ["orderbook", marketData.market_id],
  //           (prevData: Orderbook | undefined) => {
  //             if (prevData == null) {
  //               return undefined;
  //             }
  //             if (priceLevel.side === "buy") {
  //               for (const [i, lvl] of prevData.bids.entries()) {
  //                 if (priceLevel.price === lvl.price) {
  //                   return {
  //                     bids: [
  //                       ...prevData.bids.slice(0, i),
  //                       { price: priceLevel.price, size: priceLevel.size },
  //                       ...prevData.bids.slice(i + 1),
  //                     ],
  //                     asks: prevData.asks,
  //                     updatedLevel: { ...priceLevel },
  //                   };
  //                 } else if (priceLevel.price > lvl.price) {
  //                   return {
  //                     bids: [
  //                       ...prevData.bids.slice(0, i),
  //                       { price: priceLevel.price, size: priceLevel.size },
  //                       ...prevData.bids.slice(i),
  //                     ],
  //                     asks: prevData.asks,
  //                     updatedLevel: { ...priceLevel },
  //                   };
  //                 }
  //               }
  //               return {
  //                 bids: [
  //                   ...prevData.bids,
  //                   { price: priceLevel.price, size: priceLevel.size },
  //                 ],
  //                 asks: prevData.asks,
  //                 updatedLevel: { ...priceLevel },
  //               };
  //             } else {
  //               for (const [i, lvl] of prevData.asks.entries()) {
  //                 if (priceLevel.price === lvl.price) {
  //                   return {
  //                     bids: prevData.bids,
  //                     asks: [
  //                       ...prevData.asks.slice(0, i),
  //                       { price: priceLevel.price, size: priceLevel.size },
  //                       ...prevData.asks.slice(i + 1),
  //                     ],
  //                     updatedLevel: { ...priceLevel },
  //                   };
  //                 } else if (priceLevel.price < lvl.price) {
  //                   return {
  //                     bids: prevData.bids,
  //                     asks: [
  //                       ...prevData.asks.slice(0, i),
  //                       { price: priceLevel.price, size: priceLevel.size },
  //                       ...prevData.asks.slice(i),
  //                     ],
  //                     updatedLevel: { ...priceLevel },
  //                   };
  //                 }
  //               }
  //               return {
  //                 bids: prevData.bids,
  //                 asks: [
  //                   ...prevData.asks,
  //                   { price: priceLevel.price, size: priceLevel.size },
  //                 ],
  //                 updatedLevel: { ...priceLevel },
  //               };
  //             }
  //           },
  //         );
  //       } else {
  //         // TODO
  //       }
  //     } else {
  //       // TODO
  //     }
  //   };
  // }, [marketData, account?.address, queryClient]);

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
  } = useOrderBook(marketData.market_id);

  // const libraryPath = "/static/charting_library/";

  const defaultTVChartProps = useMemo(() => {
    return {
      symbol: `${marketData?.name ?? ""}`,
      interval: "1" as ResolutionString,
      datafeedUrl: "https://api.coingecko.com",
      libraryPath: "/static/charting_library/",
      clientId: "pontem.exchange",
      userId: "public_user_id",
      fullscreen: false,
      autosize: true,
      studiesOverrides: {},
      theme: "Dark" as ThemeName,
      // antipattern if we render market not found? need ! for typescript purposes
      selectedMarket: marketData as ApiMarket,
      allMarketData: allMarketData as ApiMarket[],
    };
  }, [marketData, allMarketData]);

  // const isNotSmDevice = useMediaQuery("(min-width: 768px)");

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
        <StatsBar allMarketData={allMarketData} selectedMarket={marketData} />
        <main className="flex h-full min-h-[680px] w-full grow flex-col gap-3 p-3 md:flex-row">
          <div className="flex flex-col gap-3 pb-0 md:w-[calc(100%-296px)] lg:w-[calc(100%-564px)]">
            <div className=" flex grow flex-col border border-neutral-600">
              <div className="flex h-full min-h-[400px] md:min-h-[unset]">
                {isScriptReady && <TVChartContainer {...defaultTVChartProps} />}
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
  // const res = await fetch(new URL("markets", API_URL).href);
  // const allMarketData: ApiMarket[] = await res.json();
  // TODO: Working API
  const allMarketData = await getAllMarket();
  const paths = allMarketData.map((market: ApiMarket) => ({
    params: { market_id: `${market.market_id}` },
  }));
  return { paths, fallback: false };
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
    revalidate: 600, // 10 minutes
  };
};
