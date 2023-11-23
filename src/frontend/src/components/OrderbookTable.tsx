import { useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { useOrderEntry } from "@/contexts/OrderEntryContext";
import { type ApiMarket } from "@/types/api";
import { type Orderbook, type PriceLevel } from "@/types/global";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";
import { calculateSpread } from "@/utils/formatter";
// import { Listbox } from "@headlessui/react";
// import ChevronDownIcon from "@heroicons/react/24/outline/ChevronDownIcon";
// import CheckIcon from "@heroicons/react/24/outline/CheckIcon";

// const precisionOptions: Precision[] = [
//   "0.01",
//   "0.05",
//   "0.1",
//   "0.5",
//   "1",
//   "2.5",
//   "5",
//   "10",
// ];

const Row: React.FC<{
  level: PriceLevel;
  type: "bid" | "ask";
  highestSize: number;
  marketData: ApiMarket;
  updatedLevel: PriceLevel | undefined;
}> = ({ level, type, highestSize, marketData, updatedLevel }) => {
  const { setPrice } = useOrderEntry();
  const [flash, setFlash] = useState<"flash-red" | "flash-green" | "">("");

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

  // const barPercentage = (level.size * 100) / highestSize;
  // const barColor =
  //   type === "bid" ? "rgba(110, 213, 163, 30%)" : "rgba(213, 110, 110, 30%)";

  return (
    <div
      className={` flash-bg-once px-3 ${flash} relative flex h-6 cursor-pointer items-center justify-between py-[1px] hover:ring-1 hover:ring-neutral-600`}
      onClick={() => {
        setPrice(price.toString());
      }}
      // https://github.com/econia-labs/econia/pull/371
      // commenting out this change because it overrides orderbook flash
      // style={{
      //   background: `linear-gradient(
      //     to left,
      //     ${barColor},
      //     ${barColor} ${barPercentage}%,
      //     transparent ${barPercentage}%
      //   )`,
      // }}
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
          {Number(size.toPrecision(4)).toLocaleString("fullwide")}
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
    </div>
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
  // const [precision, setPrecision] = useState<Precision>(precisionOptions[0]);

  const centerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    centerRef.current?.scrollTo({
      behavior: "smooth",
      top: 10000,
    });
  }, [isFetching]);

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
      {/* title row */}
      <div className="hidden border-b border-neutral-600 px-3 py-3 lg:block">
        <div className="flex justify-center">
          <p className="font-jost text-base font-bold text-white">Order Book</p>
          {/* select */}
          {/* TODO: SHOW WHEN API IS UP */}
          {/* <Listbox value={precision} onChange={setPrecision}>
            <div className="relative z-30 min-h-[30px] border border-neutral-600 py-[4px] pl-[8px] pr-[4px] text-[8px]/[18px]">
              <Listbox.Button className="flex min-w-[48px] justify-between font-roboto-mono text-neutral-300">
                {precision}
                <ChevronDownIcon className="my-auto ml-1 h-[10px] w-[10px] text-neutral-500" />
              </Listbox.Button>
              <Listbox.Options className="absolute left-0 top-[20px] mt-2 w-full bg-black shadow ring-1 ring-neutral-600">
                {precisionOptions.map((precisionOption) => (
                  <Listbox.Option
                    key={precisionOption}
                    value={precisionOption}
                    className={`weight-300  box-border flex min-h-[30px] cursor-pointer justify-between py-2 pl-[11px] font-roboto-mono text-neutral-300 hover:bg-neutral-800  hover:outline hover:outline-1 hover:outline-neutral-600`}
                  >
                    {precisionOption}
                    {precision === precisionOption && (
                      <CheckIcon className="my-auto ml-1 mr-2 h-4 w-4 text-white" />
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox> */}
        </div>
        <div className="mt-3 flex justify-between">
          <p className="font-roboto-mono text-xs text-neutral-500">
            PRICE ({marketData.quote.symbol})
          </p>
          <p className="font-roboto-mono text-xs text-neutral-500">
            TOTAL SIZE ({marketData.base?.symbol})
          </p>
        </div>
      </div>
      {/* bids ask spread scrollable container */}
      <div className="flex justify-between border-b border-neutral-600 pb-[10px] lg:mb-2 lg:hidden">
        <div className="flex w-[50%] justify-between px-3">
          <p className="font-roboto-mono text-xs text-neutral-500">
            BID ({marketData.quote?.symbol})
          </p>
          <p className="font-roboto-mono text-xs text-neutral-500">
            AMOUNT ({marketData.base.symbol})
          </p>
        </div>
        <div className="flex w-[50%] justify-between px-3">
          <p className="font-roboto-mono text-xs text-neutral-500">
            ASK ({marketData.quote?.symbol})
          </p>
          <p className="font-roboto-mono text-xs text-neutral-500">
            AMOUNT ({marketData.base.symbol})
          </p>
        </div>
      </div>
      <div
        className={`scrollbar-none relative flex h-[173px] grow overflow-y-auto lg:flex-col ${
          (data?.asks?.length ?? 0) < 12 || (data?.bids?.length ?? 0) < 14
            ? "flex items-center"
            : ""
        }`}
      >
        {/* hgyugyiuhi oihioho */}
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
          <div className="absolute flex h-auto w-full flex-row-reverse lg:block lg:h-full">
            {/* ASK */}
            <div
              className="scrollbar-none flex h-[calc((100%-26px)/2)] w-[calc(50%-0.5px)] grow flex-col-reverse overflow-auto lg:w-auto lg:flex-col"
              ref={centerRef}
            >
              {data?.asks
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
            {/* SPREAD */}
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
            {/* BID */}
            <div className="scrollbar-none flex h-[calc((100%-26px)/2)] w-[calc(50%+0.5px)] grow flex-col overflow-auto lg:w-auto">
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
