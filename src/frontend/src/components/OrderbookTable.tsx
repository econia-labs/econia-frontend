// import { useWindowSize } from "@uidotdev/usehooks";
import Tooltip from "rc-tooltip";
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowSize } from "usehooks-ts";

import Skeleton from "@/components/Skeleton";
import { useOrderEntry } from "@/contexts/OrderEntryContext";
import { useOrderBookData } from "@/features/hooks";
import { type ApiMarket } from "@/types/api";
import { type Orderbook, type PriceLevel } from "@/types/global";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";
import { calculateSpread } from "@/utils/formatter";

import { TokenSymbol } from "./TokenSymbol";

const Row: React.FC<{
  level: PriceLevel;
  type: "bid" | "ask";
  highestSize: number;
  marketData: ApiMarket;
  updatedLevel: PriceLevel | undefined;
}> = ({ level, type, highestSize, marketData, updatedLevel }) => {
  const { setPrice } = useOrderEntry();
  const [flash, setFlash] = useState<"flash-red" | "flash-green" | "">("");
  const { focus, setFocus } = useOrderBookData(marketData);

  useEffect(() => {
    if (updatedLevel == undefined) {
      return;
    }
    if (updatedLevel.price == level.price) {
      setFlash(type === "ask" ? "flash-red" : "flash-green");
      setTimeout(() => {
        setFlash("");
      }, 100);
    }
  }, [type, updatedLevel, level.price]);

  const price = toDecimalPrice({
    price: level.price,
    marketData,
  }).toNumber();

  const size = toDecimalSize({
    size: level.size,
    marketData: marketData,
  });
  return (
    <Tooltip
      placement="left"
      mouseLeaveDelay={0}
      overlay={
        focus.price === price && focus.side ? (
          <div className="w- h-fit  border border-neutral-600 bg-neutral-800 bg-noise px-4 py-2 font-roboto-mono text-neutral-500">
            <div className="flex items-center justify-between gap-6">
              <span>Average price </span>
              <span className="text-white">
                {focus.average.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span>Sum {marketData.base.symbol} </span>
              <span className="text-white">
                {focus.totalBase.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span>Sum {marketData.quote.symbol} </span>
              <span className="text-white">
                {focus.totalQuote.toLocaleString()}
              </span>
            </div>
          </div>
        ) : null
      }
      overlayInnerStyle={{
        width: "fit-content",
        maxHeight: "fit-content",
        padding: 0,
        borderRadius: 0,
      }}
    >
      <div
        onMouseEnter={() => setFocus({ side: type, price })}
        onMouseLeave={() => setFocus({ side: "", price })}
        className={`flash-bg-once relative pl-[17.03px] pr-[17.57px] ${flash} relative flex h-6 cursor-pointer items-center justify-between py-[1px] hover:ring-1 hover:ring-neutral-600`}
        onClick={() => {
          setPrice(price.toString());
        }}
      >
        <div className={`flex w-full justify-between  lg:flex-row`}>
          <div
            className={`z-10  text-right font-roboto-mono text-xs ${
              type === "ask" ? "text-red" : "text-green"
            }`}
          >
            {price.toLocaleString()}
          </div>
          <div className={`z-10  py-0.5 font-roboto-mono text-xs text-white `}>
            {Number(size).toLocaleString()}
          </div>
        </div>
        <div
          className={`absolute  z-0 h-full ${
            type === "ask"
              ? "left-0 bg-red/30 lg:left-[unset] lg:right-0"
              : "right-0 bg-green/30"
          }`}
          // dynamic taillwind?

          style={{ width: `${(100 * level.size) / highestSize}%` }}
        ></div>
        <div
          className={`mask pointer-events-none absolute left-0 top-0 w-full bg-white/[0.1] ${
            (focus.side === "ask" && type === "ask" && price <= focus.price) ||
            (focus.side === "bid" && type === "bid" && price >= focus.price)
              ? "h-full"
              : "h-0"
          }`}
        ></div>
      </div>
    </Tooltip>
  );
};

export function OrderbookTable({
  marketData,
  data,
  isFetching,
  isLoading,
}: {
  marketData: ApiMarket;
  data: Orderbook | undefined;
  isFetching: boolean;
  isLoading: boolean;
}) {
  const [isSmallWindow, setIsSmallWindow] = useState(false);

  const { width } = useWindowSize();

  const centerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSmallWindow(width! < 1024);
  }, [width]);

  useEffect(() => {
    centerRef.current?.scrollTo({
      behavior: "smooth",
      top: width! < 1024 ? 0 : 10000,
    });
  }, [isFetching, width]);

  const spread: PriceLevel | undefined = useMemo(() => {
    if (data == null) {
      return undefined;
    }
    const minAsk = data.asks ? data.asks[0] : undefined;
    const maxBid = data.bids ? data.bids[0] : undefined;
    return calculateSpread(minAsk, maxBid);
  }, [data]);

  const highestSize = useMemo(() => {
    if (!data) return 0;

    const asks = data.asks || [];
    const bids = data.bids || [];

    const askSizes = asks.map((order) => order.size);
    const bidSizes = bids.map((order) => order.size);

    const allSizes = [...askSizes, ...bidSizes];

    return Math.max(...allSizes);
  }, [data]);

  return (
    <div className="flex grow flex-col">
      <div className="hidden h-[60px] w-[252px] flex-col justify-center pl-[17.03px] pr-[11.27px] lg:flex">
        <div className="flex justify-between">
          <p className="font-jost text-base font-bold text-white">Order Book</p>
        </div>
        <div className="mt-1 flex justify-between">
          <p className="font-roboto-mono text-xs font-light text-neutral-500">
            PRICE <TokenSymbol symbol={marketData.quote.symbol} />
          </p>
          <p className="font-roboto-mono text-xs font-light text-neutral-500">
            SIZE <TokenSymbol symbol={marketData.base?.symbol} />
          </p>
        </div>
      </div>
      <div className="flex h-[30px] lg:mb-2 lg:hidden">
        <div className="flex w-[50%] justify-between px-3 pl-4 pt-[7px] lg:px-3 lg:pt-[12px]">
          <p className="whitespace-nowrap font-roboto-mono text-xs text-neutral-500">
            BID <TokenSymbol symbol={marketData.quote?.symbol} />
          </p>
          <p className="whitespace-nowrap font-roboto-mono text-xs text-neutral-500">
            AMOUNT <TokenSymbol symbol={marketData.base.symbol} />
          </p>
        </div>
        <div className="flex w-[50%] justify-between px-3 pl-4 pt-[7px] lg:px-3 lg:pt-[12px]">
          <p className="whitespace-nowrap font-roboto-mono text-xs text-neutral-500">
            ASK <TokenSymbol symbol={marketData.quote?.symbol} />
          </p>
          <p className="whitespace-nowrap font-roboto-mono text-xs text-neutral-500">
            AMOUNT <TokenSymbol symbol={marketData.base.symbol} />
          </p>
        </div>
      </div>
      <div className="h-[1px] bg-neutral-600"></div>
      <div
        className={`scrollbar-none relative flex h-[173px] grow pt-[6.53px] lg:flex-col ${
          (data?.asks?.length ?? 0) < 12 || (data?.bids?.length ?? 0) < 14
            ? "flex items-center"
            : ""
        }`}
      >
        {isLoading ? (
          <div className="absolute  w-full">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                className="relative flex h-6 w-full cursor-pointer items-center justify-between py-[1px] hover:ring-1 hover:ring-neutral-600"
                key={"skeleton-" + i}
              >
                <Skeleton
                  containerClassName={`z-10 ml-2 font-roboto-mono text-xs text-left`}
                  style={{
                    width: `${i % 2 == 0 ? 90 : 70}px`,
                  }}
                />
                <Skeleton
                  containerClassName="z-10 mr-2 py-0.5 font-roboto-mono text-xs text-white text-right"
                  style={{
                    width: `${i % 2 == 0 ? 90 : 70}px`,
                  }}
                />

                <div className={`absolute right-0 z-0 h-full opacity-30`}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute flex h-full w-full flex-row-reverse pb-2 lg:block">
            <div
              className=" scrollbar-none flex h-full max-h-full w-[calc(50%-0.5px)] grow flex-col overflow-auto lg:h-[calc((100%-26px)/2)] lg:w-auto"
              ref={centerRef}
            >
              <div className="grow"></div>
              {isSmallWindow
                ? data?.asks
                    ?.slice()
                    .map((level) => (
                      <Row
                        level={level}
                        type={"ask"}
                        key={`ask-${level.price}-${level.size}`}
                        highestSize={highestSize}
                        marketData={marketData}
                        updatedLevel={data.updatedLevel}
                      />
                    ))
                : data?.asks
                    ?.slice()
                    .reverse()
                    .map((level) => (
                      <Row
                        level={level}
                        type={"ask"}
                        key={`ask-${level.price}-${level.size}`}
                        highestSize={highestSize}
                        marketData={marketData}
                        updatedLevel={data.updatedLevel}
                      />
                    ))}
            </div>
            <div className="hidden items-center justify-between border-y border-neutral-600 lg:flex">
              <div className="z-10 ml-4 text-right font-roboto-mono text-xs text-white">
                {toDecimalPrice({
                  price: spread?.price || 0,
                  marketData,
                }).toNumber()}
              </div>
              <div className="mr-4 font-roboto-mono text-white">
                {spread?.size
                  ? toDecimalSize({
                      size: spread.size,
                      marketData: marketData,
                    }).toNumber()
                  : "-"}
              </div>
            </div>
            <div className="scrollbar-none flex h-full w-[calc(50%+0.5px)] grow flex-col overflow-y-auto lg:h-[calc((100%-26px)/2)] lg:w-auto">
              {data?.bids?.map((level) => (
                <Row
                  level={level}
                  type={"bid"}
                  key={`bid-${level.price}-${level.size}`}
                  highestSize={highestSize}
                  marketData={marketData}
                  updatedLevel={data.updatedLevel}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
