import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import { type ApiMarket, type ApiOrder } from "@/types/api";
import Skeleton from "react-loading-skeleton";

const mockTradeHistory = [
  {
    market_order_id: 1,
    market_id: 0,
    side: "ask",
    remaining_size: 750,
    price: 1050,
    user_address: "0x2",
    custodian_id: 1,
    order_status: "partially_filled",
    created_at: "2023-04-30T12:36:00.123456Z",
  },
  {
    market_order_id: 2,
    market_id: 1,
    side: "bid",
    remaining_size: 800,
    price: 980,
    user_address: "0x3",
    custodian_id: null,
    order_status: "open",
    created_at: "2023-04-30T12:37:15.987654Z",
  },
  {
    market_order_id: 3,
    market_id: 2,
    side: "ask",
    remaining_size: 600,
    price: 1100,
    user_address: "0x4",
    custodian_id: 2,
    order_status: "partially_filled",
    created_at: "2023-04-30T12:38:30.111111Z",
  },
  {
    market_order_id: 4,
    market_id: 0,
    side: "bid",
    remaining_size: 950,
    price: 990,
    user_address: "0x5",
    custodian_id: null,
    order_status: "open",
    created_at: "2023-04-30T12:39:45.222222Z",
  },
  {
    market_order_id: 5,
    market_id: 1,
    side: "ask",
    remaining_size: 700,
    price: 1080,
    user_address: "0x6",
    custodian_id: 3,
    order_status: "partially_filled",
    created_at: "2023-04-30T12:40:10.333333Z",
  },
  {
    market_order_id: 6,
    market_id: 2,
    side: "bid",
    remaining_size: 850,
    price: 970,
    user_address: "0x7",
    custodian_id: null,
    order_status: "filled",
    created_at: "2023-04-30T12:41:55.444444Z",
  },
  {
    market_order_id: 7,
    market_id: 0,
    side: "ask",
    remaining_size: 500,
    price: 1120,
    user_address: "0x8",
    custodian_id: 4,
    order_status: "open",
    created_at: "2023-04-30T12:42:20.555555Z",
  },
  {
    market_order_id: 8,
    market_id: 1,
    side: "bid",
    remaining_size: 900,
    price: 960,
    user_address: "0x9",
    custodian_id: null,
    order_status: "partially_filled",
    created_at: "2023-04-30T12:43:30.666666Z",
  },
  {
    market_order_id: 9,
    market_id: 2,
    side: "ask",
    remaining_size: 450,
    price: 1150,
    user_address: "0xA",
    custodian_id: 5,
    order_status: "filled",
    created_at: "2023-04-30T12:44:45.777777Z",
  },
  {
    market_order_id: 10,
    market_id: 0,
    side: "bid",
    remaining_size: 920,
    price: 940,
    user_address: "0xB",
    custodian_id: null,
    order_status: "open",
    created_at: "2023-04-30T12:46:00.888888Z",
  },
  {
    market_order_id: 11,
    market_id: 1,
    side: "ask",
    remaining_size: 550,
    price: 1180,
    user_address: "0xC",
    custodian_id: 6,
    order_status: "filled",
    created_at: "2023-04-30T12:47:15.999999Z",
  },
  {
    market_order_id: 12,
    market_id: 2,
    side: "bid",
    remaining_size: 880,
    price: 930,
    user_address: "0xD",
    custodian_id: null,
    order_status: "open",
    created_at: "2023-04-30T12:48:10.123456Z",
  },
  {
    market_order_id: 13,
    market_id: 0,
    side: "ask",
    remaining_size: 480,
    price: 1200,
    user_address: "0xE",
    custodian_id: 7,
    order_status: "partially_filled",
    created_at: "2023-04-30T12:49:25.234567Z",
  },
  {
    market_order_id: 14,
    market_id: 1,
    side: "bid",
    remaining_size: 870,
    price: 920,
    user_address: "0xF",
    custodian_id: null,
    order_status: "open",
    created_at: "2023-04-30T12:50:40.345678Z",
  },
  {
    market_order_id: 15,
    market_id: 2,
    side: "ask",
    remaining_size: 420,
    price: 1250,
    user_address: "0x10",
    custodian_id: 8,
    order_status: "filled",
    created_at: "2023-04-30T12:51:55.456789Z",
  },
];

const columnHelper = createColumnHelper<ApiOrder>();

export const TradeHistoryTable: React.FC<{
  className?: string;
  marketData: ApiMarket;
}> = ({ className, marketData }) => {
  const { data, isLoading } = useQuery<ApiOrder[]>(
    ["useTradeHistory", marketData.market_id],
    async () => {
      return mockTradeHistory as ApiOrder[];
      // TODO: Endpoint needs to return data
      // return await fetch(
      //   `${API_URL}/markets/${
      //     marketData.market_id
      //   }/fills?from=${0}&to=${Math.floor(Date.now() / 1000)}`
      // ).then((res) => res.json());
    },
  );
  const table = useReactTable({
    columns: [
      columnHelper.accessor("price", {
        cell: (info) => info.getValue(),
        header: () => "PRICE",
      }),
      columnHelper.accessor("remaining_size", {
        cell: (info) => info.getValue(),
        header: () => "AMOUNT",
      }),
      columnHelper.accessor("created_at", {
        cell: (info) =>
          new Date(info.getValue()).toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
          }),
        header: () => "TIME",
      }),
    ],
    data: data || [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table
      className={"w-full table-fixed" + (className ? ` ${className}` : "")}
    >
      <thead className="sticky top-12 bg-neutral-800 bg-noise">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr
            className="text-left font-roboto-mono text-sm text-neutral-500 [&>th]:font-light"
            key={headerGroup.id}
          >
            {headerGroup.headers.map((header, i) => (
              <th
                className={`text-xs ${
                  i === 0
                    ? "pl-4 text-left"
                    : i === 1
                    ? "text-left"
                    : "pr-4 text-right"
                } w-full`}
                key={header.id}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        <tr className="sticky top-[66px] bg-neutral-800 bg-noise">
          <td colSpan={7} className="py-2">
            <div className="h-[1px] bg-neutral-600"></div>
          </td>
        </tr>
        {isLoading || !data ? (
          <>
            {/* temporarily removing skeletong to help UX and reduce glitchyness. see: ECO-230 */}
            {/* <tr>
              {table.getAllColumns().map((column, i) => (
                <td
                  className={`text-xs ${
                    i === 0
                      ? "pl-4 text-left"
                      : i === 1
                      ? "text-left"
                      : "pr-4 text-right"
                  }`}
                  key={column.id}
                >
                  <div className={"px-1"}>
                    <Skeleton />
                  </div>
                </td>
              ))}
            </tr> */}
          </>
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={7}>
              <div className="flex h-[150px] flex-col items-center justify-center text-sm font-light uppercase text-neutral-500">
                No orders to show
              </div>
            </td>
          </tr>
        ) : (
          table.getRowModel().rows.map((row) => (
            <tr
              className="text-left font-roboto-mono text-sm uppercase text-white [&>th]:font-light"
              key={row.id}
            >
              {row.getVisibleCells().map((cell, i) => (
                <td
                  className={`text-xs ${
                    i === 0
                      ? "pl-4 text-left"
                      : i === 1
                      ? "text-left"
                      : "pr-4 text-right"
                  }`}
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};
