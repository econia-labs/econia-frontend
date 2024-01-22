import { useQuery } from "@tanstack/react-query";
import React, { type ReactNode } from "react";

import { type ApiMarket, type ApiOrder, type TradeHistory } from "@/types/api";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";

import bg from "../../../../public/bg.png";
import { API_URL, NETWORK_NAME } from "../../../env";
import { TokenSymbol } from "../../TokenSymbol";

interface RowDetailsProps {
  label: string;
  value?: string | number;
  symbol?: string;
  children?: ReactNode;
}

interface OrderDetailsModalContentProps {
  orderDetails: ApiOrder | null;
  baseSymbol: string;
  quoteSymbol: string;
  marketData: ApiMarket;
  cancelOrder: (orderInfo: ApiOrder) => void;
  loading: boolean;
}

const RowDetails: React.FC<RowDetailsProps> = ({
  label,
  value,
  symbol,
  children,
}) => (
  <div className="flex justify-between px-4 py-1 text-sm hover:bg-neutral-600 hover:bg-opacity-30">
    <span className="font-light uppercase text-neutral-500">{label}</span>
    <span className="text-neutral-400">
      {value !== 0 && symbol ? (
        <>
          {value} <TokenSymbol symbol={symbol} />
        </>
      ) : (
        <>{children}</>
      )}
    </span>
  </div>
);

export const OrderDetailsModalContent: React.FC<
  OrderDetailsModalContentProps
> = ({ orderDetails, baseSymbol, quoteSymbol, marketData, cancelOrder }) => {
  const { data } = useQuery<TradeHistory>(
    ["useOrderDetailsModalContent", orderDetails?.order_id],
    async () => {
      if (!orderDetails) return [];

      const { order_id, order_status } = orderDetails;

      let endpoint = "";
      if (order_status === "cancelled") {
        endpoint = `${API_URL}/cancel_order_events?order_id=eq.${order_id}`;
      } else if (order_status === "closed") {
        endpoint = `${API_URL}/fill_events_deduped?taker_order_id=eq.${order_id}`;
      }

      if (endpoint) {
        const response = await fetch(new URL(endpoint));
        const data = await response.json();
        return data[0];
      }

      return [];
    },
  );

  if (!orderDetails) {
    return null;
  }

  const {
    order_id,
    created_at,
    order_type,
    direction,
    order_status,
    price,
    total_filled,
    average_execution_price,
    remaining_size,
  } = orderDetails;

  const timePlaced = new Date(created_at).toLocaleString("en-US", {
    month: "numeric",
    day: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });

  const EXPLORER_URL = (txn_version: number | undefined) =>
    `https://explorer.aptoslabs.com/txn/${txn_version}?network=${NETWORK_NAME}`;

  const orderId = (() => {
    if (order_status === "open" || !data?.txn_version) return order_id;

    return (
      <a
        className="cursor-pointer hover:text-blue"
        href={EXPLORER_URL(data.txn_version)}
        target="_blank"
      >
        {order_id}
      </a>
    );
  })();

  const name = `${baseSymbol}-${quoteSymbol}`;

  const type = order_type.toUpperCase();

  const side = (() => {
    if (direction === "bid" || direction === "buy")
      return <span className="text-green">BID</span>;

    return <span className="text-red">ASK</span>;
  })();

  const limitPrice = (() => {
    if (price != null && typeof price === "number")
      return toDecimalPrice({ price, marketData }).toNumber();

    return 0;
  })();

  const avgExecPrice = (() => {
    if (average_execution_price !== null)
      return toDecimalPrice({
        price: average_execution_price,
        marketData,
      }).toNumber();

    return 0;
  })();

  const remainingSize = toDecimalSize({
    size: remaining_size,
    marketData,
  }).toNumber();

  const totalFilled = (() => {
    if (total_filled !== null)
      return toDecimalSize({ size: total_filled, marketData }).toNumber();

    return 0;
  })();

  const totalVol = (() => {
    if (!total_filled || !average_execution_price) return 0;

    const totalVolume = totalFilled + avgExecPrice;

    return totalVolume.toLocaleString(undefined, { maximumFractionDigits: 5 });
  })();

  const orderStatus = (() => {
    let className = "";
    switch (order_status) {
      case "open":
        className = "text-blue";
        break;
      case "cancelled":
        className = "text-red";
        break;
      case "closed":
        className = "text-green";
        break;
    }

    return <span className={className}>{order_status.toUpperCase()}</span>;
  })();

  const cancel = (() => {
    if (order_status !== "open") return "";

    return (
      <button
        className="uppercase text-red hover:text-[#DC2B2B]"
        onClick={(e) => {
          e.stopPropagation();
          cancelOrder(orderDetails);
        }}
      >
        Cancel
      </button>
    );
  })();

  return (
    <div
      style={{ backgroundImage: `url(${bg.src})` }}
      className="w-full bg-neutral-800 p-6"
    >
      <div className="text-center text-lg font-bold">Order Details</div>
      <div className="flex flex-col pt-2  font-roboto-mono text-sm">
        <RowDetails label="Order ID">{orderId}</RowDetails>
        <RowDetails label="Time Placed">{timePlaced}</RowDetails>
        <RowDetails label="Name">{name}</RowDetails>
        <RowDetails label="Type">{type}</RowDetails>
        <RowDetails label="Side">{side}</RowDetails>
        <RowDetails
          label="Limit Price"
          value={limitPrice}
          symbol={quoteSymbol}
        />
        <RowDetails
          label="Avg exec. price"
          value={avgExecPrice}
          symbol={quoteSymbol}
        />
        <RowDetails
          label="RMNG SIZE"
          value={remainingSize}
          symbol={baseSymbol}
        />
        <RowDetails label="Total" value={totalFilled} symbol={quoteSymbol} />
        <RowDetails label="Total Vol." value={totalVol} symbol={quoteSymbol} />
        <RowDetails label="Status">{orderStatus}</RowDetails>
        <RowDetails label="Cancel">{cancel}</RowDetails>
      </div>
    </div>
  );
};
