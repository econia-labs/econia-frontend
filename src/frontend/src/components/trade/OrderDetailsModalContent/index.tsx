import React from "react";

import { Button } from "@/components/Button";
import { type ApiOrder } from "@/types/api";

interface RowDetailsProps {
  label: string;
  value: string | number | undefined;
}

interface OrderDetailsModalContentProps {
  onClose: () => void;
  orderDetails: ApiOrder | null;
  pair: string;
}

const RowDetails: React.FC<RowDetailsProps> = ({ label, value }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span className="text-neutral-500">{capitalizeFirstLetter(value)}</span>
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
> = ({ onClose, orderDetails, pair }) => {
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
        <RowDetails label="Pair" value={pair} />
        <RowDetails label="Type" value={order_type} />
        <RowDetails label="Side" value={direction} />
        <RowDetails label="Amount" value={total_filled} />
        <RowDetails label="Limit Price" value={price} />
        <RowDetails label="Fee" value="null" />
        <RowDetails
          label="Total"
          value={
            average_execution_price === null
              ? "-"
              : total_filled * average_execution_price
          }
        />
        <RowDetails label="Status" value={order_status} />
      </div>
      <Button className="w-full" variant="red" onClick={onClose}>
        Cancel Order
      </Button>
    </>
  );
};
