import React from "react";

import { Button } from "@/components/Button";
import { type ApiMarket, type ApiOrder } from "@/types/api";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";

interface RowDetailsProps {
  label: string;
  value: string | number | undefined;
}

interface OrderDetailsModalContentProps {
  orderDetails: ApiOrder | null;
  baseSymbol: string;
  quoteSymbol: string;
  marketData: ApiMarket;
  cancelOrder: (orderInfo: ApiOrder) => void;
  loading: boolean;
}

const RowDetails: React.FC<RowDetailsProps> = ({ label, value }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span className="text-neutral-500">
      {label === "Pair" ? value : capitalizeFirstLetter(value)}
    </span>
  </div>
);

function capitalizeFirstLetter(str: string | number | undefined) {
  // Check if the input is a string
  if (typeof str !== "string") {
    return str;
  }

  // Check if the input string is not empty
  if (str.length === 0) {
    return str;
  }

  // Capitalize the first letter and concatenate it with the rest of the string
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const OrderDetailsModalContent: React.FC<
  OrderDetailsModalContentProps
> = ({
  orderDetails,
  baseSymbol,
  quoteSymbol,
  marketData,
  cancelOrder,
  loading,
}) => {
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
  } = orderDetails;

  const amount = toDecimalSize({
    size: total_filled,
    marketData,
  }).toNumber();

  const limitPrice =
    price != null
      ? toDecimalPrice({
          price,
          marketData,
        }).toNumber()
      : "-";

  const convertedAvgPrice =
    average_execution_price != null
      ? toDecimalPrice({
          price: average_execution_price,
          marketData,
        }).toNumber()
      : "-";

  return (
    <>
      {/* Modal Title */}
      <div className="text-left text-lg font-bold">Order Details</div>
      {/* Modal Content */}
      <div className="my-8 flex flex-col gap-8">
        <RowDetails label="Order ID" value={order_id} />
        <RowDetails
          label="Time Placed"
          value={new Date(created_at).toLocaleString("en-US", {
            month: "numeric",
            day: "2-digit",
            year: "2-digit",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
          })}
        />
        <RowDetails label="Pair" value={`${baseSymbol}-${quoteSymbol}`} />
        <RowDetails label="Type" value={order_type} />
        <RowDetails label="Side" value={direction} />
        <RowDetails label="Amount" value={`${amount} ${baseSymbol}`} />
        <RowDetails
          label="Limit Price"
          value={`${limitPrice} ${quoteSymbol}`}
        />
        <RowDetails label="Fee" value="-" />
        <RowDetails
          label="Total"
          value={
            convertedAvgPrice === "-"
              ? convertedAvgPrice
              : amount * convertedAvgPrice + " " + quoteSymbol
          }
        />
        <RowDetails label="Status" value={order_status} />
      </div>
      <Button
        className="w-full"
        variant="red"
        onClick={() => {
          cancelOrder(orderDetails);
        }}
        disabledReason={
          loading
            ? "Cancelling order..."
            : order_status !== "open"
            ? "Order already cancelled"
            : undefined
        }
      >
        Cancel Order
      </Button>
    </>
  );
};
