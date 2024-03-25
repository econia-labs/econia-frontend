import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import { useWindowSize } from "@uidotdev/usehooks";
import BigNumber from "bignumber.js";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import Skeleton from "@/components/Skeleton";
import { useAptos } from "@/contexts/AptosContext";
import { useOrderEntry } from "@/contexts/OrderEntryContext";
import { API_URL } from "@/env";
import { useOrderBookData } from "@/features/hooks";
import { setPriceStats } from "@/features/priceStatsSlice";
import { type ApiMarket } from "@/types/api";
import { toDecimalPrice, toDecimalQuote, toDecimalSize } from "@/utils/econia";
import { plusMinus } from "@/utils/formatter";
import { TypeTag } from "@/utils/TypeTag";

import { DiscordIcon } from "./icons/DiscordIcon";
import { MediumIcon } from "./icons/MediumIcon";
import { TwitterIcon } from "./icons/TwitterIcon";
import { MarketIconPair } from "./MarketIconPair";
import { BaseModal } from "./modals/BaseModal";
import { TokenSymbol } from "./TokenSymbol";
import { SelectMarketContent } from "./trade/DepositWithdrawModal/SelectMarketContent";

const DEFAULT_TOKEN_ICON = "/tokenImages/default.svg";

const SocialMediaIcons: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className}>
      <div className="flex">
        <a
          href="https://twitter.com/EconiaLabs"
          target="_blank"
          rel="noreferrer"
          className="mx-3 aspect-square h-[18px] w-[18px] cursor-pointer text-white hover:text-blue"
        >
          <TwitterIcon />
        </a>
        <a
          href="https://discord.com/invite/Z7gXcMgX8A"
          target="_blank"
          rel="noreferrer"
          className="mx-3 aspect-square h-[18px] w-[18px] cursor-pointer text-white hover:text-blue"
        >
          <DiscordIcon />
        </a>
        <a
          href="https://medium.com/econialabs"
          target="_blank"
          rel="noreferrer"
          className="mx-3 aspect-square h-[18px] w-[18px] cursor-pointer text-white hover:text-blue"
        >
          <MediumIcon />
        </a>
      </div>
    </div>
  );
};

export const StatsBar: React.FC<{
  allMarketData: ApiMarket[];
  selectedMarket: ApiMarket;
}> = ({ allMarketData, selectedMarket }) => {
  const dispatch = useDispatch();
  const [isFirstFetch, setIsFirstFetch] = useState(true);
  const { market_id: marketId, base, quote } = selectedMarket;
  const baseSymbol = base?.symbol;
  const quoteSymbol = quote?.symbol;
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { coinListClient } = useAptos();
  const { highestBid, lowestAsk, orderBook } = useOrderBookData(selectedMarket);
  const { setPrice } = useOrderEntry();

  useEffect(() => {
    if (router.asPath.includes("?recognized=false")) {
      setIsModalOpen(true);
    }
  }, [router.asPath]);

  useEffect(() => {
    setIsFirstFetch(true);
  }, [selectedMarket]);

  const { data: iconData } = useQuery(
    ["iconData", selectedMarket],
    async () => {
      const baseAssetIcon = selectedMarket.base
        ? coinListClient.getCoinInfoByFullName(
            TypeTag.fromApiCoin(selectedMarket.base).toString(),
          )?.logo_url
        : DEFAULT_TOKEN_ICON;
      const quoteAssetIcon =
        coinListClient.getCoinInfoByFullName(
          TypeTag.fromApiCoin(selectedMarket.quote).toString(),
        )?.logo_url ?? DEFAULT_TOKEN_ICON;
      return { baseAssetIcon, quoteAssetIcon };
    },
  );

  const { data: priceInfo, isFetching: isFetchingPriceInfo } = useQuery(
    ["marketStats", marketId],
    async () => {
      const response = await fetch(
        `${API_URL}/rpc/market_aggregated_info?market=${marketId}&seconds=86400`,
      );
      const data = await response.json();
      const priceStats = data[0];
      if (!priceStats) {
        return {};
      }
      dispatch(setPriceStats(data[0]));

      const formattedPriceStats = Object.keys(priceStats).reduce(
        (acc: { [key: string]: number }, key) => {
          if (key === "price_change_percentage") {
            acc[key] = priceStats[key];
          } else if (key.includes("price")) {
            acc[key] = toDecimalPrice({
              price: priceStats[key],
              marketData: selectedMarket,
            }).toNumber();
          }
          if (key.includes("quote_volume")) {
            acc[key] = toDecimalQuote({
              ticks: BigNumber(priceStats[key]),
              tickSize: BigNumber(selectedMarket.tick_size),
              quoteCoinDecimals: BigNumber(selectedMarket.quote.decimals),
            }).toNumber();
          } else {
            acc[key] = toDecimalSize({
              size: priceStats[key],
              marketData: selectedMarket,
            }).toNumber();
          }
          return acc;
        },
        {},
      );
      if (formattedPriceStats.last_price) {
        setPrice(formattedPriceStats.last_price.toString());
      }
      setIsFirstFetch(false);
      return formattedPriceStats;
    },
    {
      keepPreviousData: false,
      refetchOnWindowFocus: false,
      refetchInterval: 10 * 1000,
    },
  );

  useEffect(() => {
    if (!isFetchingPriceInfo) setIsFirstFetch(false);
  }, [isFetchingPriceInfo]);

  const [isSmallWindow, setIsSmallWindow] = useState(false);

  const { width } = useWindowSize();

  useEffect(() => {
    setIsSmallWindow(width! < 640);
  }, [width]);

  return (
    <>
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        showCloseButton={false}
        className={"!p-0 sm:w-[547px] md:w-[686px] lg:w-[786px]"}
      >
        <SelectMarketContent
          allMarketData={allMarketData}
          onSelectMarket={(id, name) => {
            setIsModalOpen(false);
            if (name == undefined) {
              toast.error("Selected market is undefined, please try again.");
              return;
            }
            router.push(`/market/${name}`);
          }}
        />
      </BaseModal>
      {isModalOpen && isSmallWindow && (
        <div
          className={`fixed inset-0 z-[60] flex h-full w-full items-center justify-center overflow-hidden bg-black text-center font-jost text-2xl font-bold text-white`}
        >
          For the best experience,
          <br />
          please use a larger screen.
        </div>
      )}
      <div className="hidden justify-between border-b border-neutral-600 px-[29.19px] py-3 md:flex lg:pr-[46.24px]">
        <div className="flex  overflow-x-clip whitespace-nowrap">
          <button
            className="flex items-center outline-none "
            onClick={() => {
              setIsModalOpen(true);
            }}
          >
            <MarketIconPair
              baseAssetIcon={iconData?.baseAssetIcon}
              quoteAssetIcon={iconData?.quoteAssetIcon}
            />
            <div className="ml-2 min-w-[130px] lg:min-w-[160px]">
              <div className="flex gap-3 font-roboto-mono text-base font-medium text-neutral-300">
                {baseSymbol} - {quoteSymbol}
                <ChevronDownIcon className="my-auto ml-1 h-[18px] w-[18px] text-white" />
              </div>
            </div>
          </button>
          <div className="block md:hidden">
            <p className="font-roboto-mono font-light">
              <span className="inline-block min-w-[4em] text-xl text-white">
                {isFetchingPriceInfo && isFirstFetch ? (
                  <Skeleton />
                ) : priceInfo?.last_price != undefined ? (
                  priceInfo.last_price
                ) : (
                  "-"
                )}
              </span>
              <span
                className={`ml-1 inline-block min-w-[6em] text-base ${
                  (priceInfo?.price_change_nominal || 0) < 0
                    ? "text-red"
                    : "text-green"
                }`}
              >
                {isFetchingPriceInfo && isFirstFetch ? (
                  <Skeleton />
                ) : priceInfo?.price_change_nominal != undefined ? (
                  plusMinus(priceInfo.price_change_nominal) +
                  priceInfo.price_change_nominal
                ) : (
                  "-"
                )}
              </span>
            </p>
          </div>
          <div className="ml-[28.83px] hidden md:block">
            <span className="font-roboto-mono text-xs font-light text-neutral-500">
              LAST PRICE <TokenSymbol symbol={quoteSymbol} />
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.last_price != undefined ? (
                priceInfo.last_price
              ) : (
                "-"
              )}
            </p>
          </div>
          <div className="ml-4 hidden md:block lg:ml-[21.4px]">
            <span className="font-roboto-mono text-xs font-light text-neutral-500">
              24H CHANGE
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              <span className="inline-block min-w-[70px] text-white">
                {isFetchingPriceInfo && isFirstFetch ? (
                  <Skeleton />
                ) : priceInfo?.price_change_nominal != undefined ? (
                  plusMinus(priceInfo.price_change_nominal) +
                  priceInfo.price_change_nominal
                ) : (
                  "-"
                )}
              </span>
              {priceInfo?.price_change_percentage != undefined && (
                <span
                  className={`ml-2 ${
                    (priceInfo?.price_change_percentage || 0) < 0
                      ? "text-red"
                      : "text-green"
                  }`}
                >
                  {isFetchingPriceInfo && isFirstFetch ? (
                    <Skeleton />
                  ) : priceInfo?.price_change_percentage != undefined ? (
                    plusMinus(priceInfo.price_change_percentage) +
                    priceInfo.price_change_percentage.toFixed(2) +
                    "%"
                  ) : (
                    "-"
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="ml-4 hidden md:block lg:ml-[28.83px]">
            <span className="font-roboto-mono text-xs font-light uppercase text-neutral-500">
              24h high
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.high_price != undefined ? (
                priceInfo.high_price
              ) : (
                "-"
              )}
            </p>
          </div>
          <div className="ml-4 hidden md:block lg:ml-[21.4px]">
            <span className="font-roboto-mono text-xs font-light uppercase text-neutral-500">
              24h low
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.low_price != undefined ? (
                priceInfo.low_price
              ) : (
                "-"
              )}
            </p>
          </div>
          <div className="ml-4 hidden md:block lg:ml-[21.4px]">
            <span className="font-roboto-mono text-xs font-light text-neutral-500">
              24H VOLUME <TokenSymbol symbol={baseSymbol} />
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.base_volume != undefined ? (
                priceInfo.base_volume.toLocaleString(
                  undefined,
                  priceInfo.base_volume > 10000
                    ? { maximumFractionDigits: 0 }
                    : {},
                )
              ) : (
                "-"
              )}
            </p>
          </div>
          <div className="ml-4 hidden md:block lg:ml-5">
            <span className="font-roboto-mono text-xs font-light text-neutral-500">
              24H VOLUME <TokenSymbol symbol={quoteSymbol} />
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.quote_volume != undefined ? (
                priceInfo.quote_volume.toLocaleString(
                  undefined,
                  priceInfo.quote_volume > 10000
                    ? {
                        maximumFractionDigits: 0,
                      }
                    : {},
                )
              ) : (
                "-"
              )}
            </p>
          </div>
        </div>

        <SocialMediaIcons className={"my-auto hidden md:block"} />
      </div>
      <div className="flex h-[120px] flex-shrink-0 flex-col justify-center border-b border-neutral-600 px-[29.28px] pr-[30.85px] md:hidden">
        <div className="flex w-full justify-between">
          <div className="flex h-fit items-center">
            <MarketIconPair
              baseAssetIcon={iconData?.baseAssetIcon}
              quoteAssetIcon={iconData?.quoteAssetIcon}
            />
            <div className="ml-4 min-w-[160px]">
              <button
                className="flex font-roboto-mono text-base font-medium text-neutral-300"
                onClick={() => {
                  setIsModalOpen(true);
                }}
              >
                {selectedMarket.name.split("-").join("  -  ")}
                <ChevronDownIcon className="my-auto ml-5 h-[18px] w-[18px] text-white" />
              </button>
            </div>
          </div>
          <div className="">
            <p className="font-roboto-mono font-light">
              <span className="inline-block min-w-[3.5em]  text-base font-medium text-white">
                {isFetchingPriceInfo && isFirstFetch ? (
                  <Skeleton />
                ) : priceInfo?.last_price != undefined ? (
                  ` $${priceInfo.last_price}`
                ) : (
                  "-"
                )}
              </span>
              <span
                className={`block  text-xs ${
                  (priceInfo?.price_change_nominal || 0) < 0
                    ? "text-red"
                    : "text-green"
                }`}
              >
                {isFetchingPriceInfo && isFirstFetch ? (
                  <Skeleton />
                ) : priceInfo?.price_change_nominal != undefined ? (
                  plusMinus(priceInfo.price_change_nominal) +
                  priceInfo.price_change_nominal
                ) : (
                  "-"
                )}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-[5.73px] flex gap-4 pl-[0.07px]">
          <div className="flex gap-3">
            <span className="font-roboto-mono text-xs font-light uppercase text-neutral-500">
              high
            </span>
            <span className="min-w-[4em] font-roboto-mono text-xs font-normal text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.high_price != undefined ? (
                priceInfo.high_price
              ) : (
                "-"
              )}
            </span>
          </div>

          <div className="flex gap-3">
            <span className="font-roboto-mono text-xs font-light uppercase text-green">
              BID
            </span>
            <span className="min-w-[3em] font-roboto-mono text-xs font-normal text-white">
              {orderBook.isLoading ? (
                <Skeleton />
              ) : highestBid?.price ? (
                toDecimalPrice({
                  price: highestBid.price,
                  marketData: selectedMarket,
                }).toString()
              ) : (
                "-"
              )}
            </span>
          </div>
          <div className="flex gap-3">
            <span className="min-w-[75px] font-roboto-mono text-xs  font-light text-neutral-500">
              VOL <TokenSymbol symbol={baseSymbol} />
            </span>
            <span className="min-w-[4em] font-roboto-mono text-xs font-normal text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.base_volume != undefined ? (
                priceInfo.base_volume.toLocaleString(
                  undefined,
                  priceInfo.base_volume > 10000
                    ? { maximumFractionDigits: 0 }
                    : {},
                )
              ) : (
                "-"
              )}
            </span>
          </div>
        </div>
        <div className="mt-1 flex gap-4 pl-[0.07px]">
          <div className="flex gap-3">
            <span className="min-w-[28.81px] font-roboto-mono text-xs font-light uppercase text-neutral-500">
              {"low "}
            </span>
            <span className="min-w-[4em] font-roboto-mono text-xs font-normal text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.low_price != undefined ? (
                priceInfo.low_price
              ) : (
                "-"
              )}
            </span>
          </div>

          <div className="flex gap-3">
            <span className="font-roboto-mono text-xs font-light uppercase text-red">
              ASK
            </span>
            <span className="min-w-[3em] font-roboto-mono text-xs font-normal text-white">
              {orderBook.isLoading ? (
                <Skeleton />
              ) : lowestAsk?.price ? (
                toDecimalPrice({
                  price: lowestAsk.price,
                  marketData: selectedMarket,
                }).toString()
              ) : (
                "-"
              )}
            </span>
          </div>
          <div className="flex gap-3">
            <span className="min-w-[75px] font-roboto-mono text-xs font-light text-neutral-500">
              VOL <TokenSymbol symbol={quoteSymbol} />
            </span>
            <span className="min-w-[4em] font-roboto-mono text-xs font-normal text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.quote_volume != undefined ? (
                priceInfo.quote_volume.toLocaleString(
                  undefined,
                  priceInfo.quote_volume > 10000
                    ? { maximumFractionDigits: 0 }
                    : {},
                )
              ) : (
                "-"
              )}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
