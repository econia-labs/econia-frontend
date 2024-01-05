import { Tab } from "@headlessui/react";
import React, { useState } from "react";

import { type ApiMarket } from "@/types/api";
import { type Side } from "@/types/global";

import { LimitOrderEntry } from "./LimitOrderEntry";
import { MarketOrderEntry } from "./MarketOrderEntry";

export const OrderEntry: React.FC<{
  marketData: ApiMarket;
  defaultSide?: "buy" | "sell";
  onDepositWithdrawClick?: () => void;
}> = ({ marketData, defaultSide = "buy", onDepositWithdrawClick }) => {
  const [side, setSide] = useState<Side>(defaultSide);

  return (
    <div>
      <div className="flex gap-2 md:m-4">
        <button
          onClick={() => setSide("buy")}
          className={`w-full border-2 py-2 font-jost font-bold ${
            side === "buy"
              ? "border-green border-opacity-80 text-green"
              : "border-neutral-600 bg-neutral-700 text-neutral-600"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`w-full border-2 font-jost font-bold ${
            side === "sell"
              ? "border-red border-opacity-80 text-red"
              : "border-neutral-600 bg-neutral-700 text-neutral-600"
          }`}
        >
          Sell
        </button>
      </div>
      <Tab.Group>
        <Tab.List className="my-5 flex justify-center gap-[31.25px]">
          <Tab className="font-roboto-mono text-sm uppercase outline-none ui-selected:font-medium ui-selected:text-white ui-not-selected:font-light ui-not-selected:text-neutral-500">
            Limit
          </Tab>
          <Tab className="font-roboto-mono text-sm uppercase outline-none ui-selected:font-medium ui-selected:text-white ui-not-selected:font-light ui-not-selected:text-neutral-500">
            Market
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <LimitOrderEntry
              marketData={marketData}
              side={side}
              onDepositWithdrawClick={onDepositWithdrawClick}
            />
          </Tab.Panel>
          <Tab.Panel>
            <MarketOrderEntry
              marketData={marketData}
              side={side}
              onDepositWithdrawClick={onDepositWithdrawClick}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
