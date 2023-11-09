import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Skeleton from "react-loading-skeleton";

import { useAptos } from "@/contexts/AptosContext";
import { API_URL } from "@/env";
import { type ApiMarket } from "@/types/api";
import { formatNumber } from "@/utils/formatter";
import { TypeTag } from "@/utils/TypeTag";
import { setPriceStats } from "@/features/priceStatsSlice";

import { BaseModal } from "./modals/BaseModal";
import { DiscordIcon } from "./icons/DiscordIcon";
import { MediumIcon } from "./icons/MediumIcon";
import { TwitterIcon } from "./icons/TwitterIcon";
import { MarketIconPair } from "./MarketIconPair";
import { SelectMarketContent } from "./trade/DepositWithdrawModal/SelectMarketContent";
import { toast } from "react-toastify";

const DEFAULT_TOKEN_ICON = "/tokenImages/default.png";

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
  const { market_id: marketId, base, quote } = selectedMarket;
  const nominal = 3;
  const baseSymbol = base?.symbol;
  const quoteSymbol = quote?.symbol;
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { coinListClient } = useAptos();

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

  const { data } = useQuery(
    ["marketStats", selectedMarket],
    async () => {
      const response = await fetch(
        `${API_URL}/rpc/market_aggregated_info?market=${marketId}&seconds=86400`,
      );
      const data = await response.json();
      const priceStats = data[0];
      dispatch(setPriceStats(data[0]));
      // for each value of the price stats except for price_change_percentage, convert it to nominal by dividing by 10^nominal
      const formattedPriceStats = Object.keys(priceStats).reduce(
        (acc: any, key) => {
          if (key !== "price_change_percentage") {
            acc[key] = priceStats[key] / Math.pow(10, nominal);
          } else {
            acc[key] = priceStats[key];
          }
          return acc;
        },
        {},
      );
      return formattedPriceStats;
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchInterval: 10 * 1000,
    },
  );

  return (
    <>
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        showCloseButton={false}
        className={"pl-0 pr-0"}
      >
        <SelectMarketContent
          allMarketData={allMarketData}
          onSelectMarket={(id, name) => {
            setIsModalOpen(false);
            if (name == undefined) {
              // selected an undefined market
              toast.error("Selected market is undefined, please try again.");
              return;
            }
            router.push(`/trade/${name}`);
          }}
        />
      </BaseModal>
      <div className="flex justify-between border-b border-neutral-600 px-9 py-3">
        <div className="flex overflow-x-clip whitespace-nowrap">
          <div className="flex items-center">
            <MarketIconPair
              baseAssetIcon={iconData?.baseAssetIcon}
              quoteAssetIcon={iconData?.quoteAssetIcon}
            />
            <div className="min-w-[160px]">
              <button
                className="flex font-roboto-mono text-base font-medium text-neutral-300"
                onClick={() => {
                  setIsModalOpen(true);
                }}
              >
                {selectedMarket.name}
                <ChevronDownIcon className="my-auto ml-1 h-[18px] w-[18px] text-white" />
              </button>
            </div>
          </div>
          {/* mobile price */}
          <div className="block md:hidden">
            <p className="font-roboto-mono font-light">
              <span className="inline-block min-w-[4em] text-xl text-white">
                {data?.last_price && "$"}
                {formatNumber(data?.last_price, 2) ?? <Skeleton />}
              </span>
              <span
                className={`ml-1 inline-block min-w-[6em] text-base ${
                  (data?.price_change_nominal || 0) < 0
                    ? "text-red"
                    : "text-green"
                }`}
              >
                {formatNumber(data?.price_change_nominal, 2, "always") ?? (
                  <Skeleton />
                )}
              </span>
            </p>
          </div>
          {/* price */}
          <div className="hidden md:block">
            <span className="font-roboto-mono text-xs font-light text-neutral-500">
              LAST PRICE
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {data?.last_price && "$"}
              {formatNumber(data?.last_price, 2) ?? <Skeleton />}
            </p>
          </div>
          {/* 24 hr */}
          <div className="ml-8 hidden md:block">
            <span className="font-roboto-mono text-xs font-light text-neutral-500">
              24H CHANGE
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              <span className="inline-block min-w-[70px] text-white">
                {formatNumber(data?.price_change_nominal, 2) ?? <Skeleton />}
              </span>
              {data?.price_change_percentage && (
                <span
                  className={`ml-2 ${
                    (data?.price_change_percentage || 0) < 0
                      ? "text-red"
                      : "text-green"
                  }`}
                >
                  {formatNumber(data?.price_change_percentage, 2, "always") ?? (
                    <Skeleton />
                  )}
                  %
                </span>
              )}
            </p>
          </div>
          {/* 24 hr high */}
          <div className="ml-8 hidden md:block">
            <span className="font-roboto-mono text-xs font-light uppercase text-neutral-500">
              24h high
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {formatNumber(data?.high_price, 2) ?? <Skeleton />}
            </p>
          </div>
          {/* 24 hr low */}
          <div className="ml-8 hidden md:block">
            <span className="font-roboto-mono text-xs font-light uppercase text-neutral-500">
              24h low
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {formatNumber(data?.low_price, 2) ?? <Skeleton />}
            </p>
          </div>
          {/* 24 hr main */}
          <div className="ml-8 hidden md:block">
            <span className="font-roboto-mono text-xs font-light text-neutral-500">
              24H VOLUME ({baseSymbol || "-"})
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {formatNumber(data?.base_volume, 2) ?? <Skeleton />}
            </p>
          </div>
          {/* 24 hr pair */}
          <div className="ml-8 hidden md:block">
            <span className="font-roboto-mono text-xs font-light text-neutral-500">
              24H VOLUME ({quoteSymbol || "-"})
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {formatNumber(data?.quote_volume, 2) ?? <Skeleton />}
            </p>
          </div>
        </div>

        <SocialMediaIcons className={"my-auto hidden md:block"} />
      </div>
    </>
  );
};
