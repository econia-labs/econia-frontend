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
import { API_URL } from "@/env";

const columnHelper = createColumnHelper<ApiOrder>();

export const TradeHistoryTable: React.FC<{
  className?: string;
  marketData: ApiMarket;
  marketId: number;
}> = ({ className, marketData, marketId }) => {
  const { data, isLoading } = useQuery<ApiOrder[]>(
    ["useTradeHistory", marketData.market_id],
    async () => {
      const response = await fetch(
        `${API_URL}/fill_events_deduped?order=txn_version.desc,event_idx.desc&market_id=eq.${marketId}&limit=100`,
      );
      const data = await response.json();
      return data;
    },
  );
  const table = useReactTable({
    columns: [
      columnHelper.accessor("price", {
        cell: (info) => info.getValue().toLocaleString(),
        header: () => "PRICE",
      }),
      columnHelper.accessor("size", {
        cell: (info) => info.getValue().toLocaleString(),
        header: () => "AMOUNT",
      }),
      columnHelper.accessor("time", {
        cell: (info) =>
          new Date(info.getValue()).toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
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
            <tr>
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
            </tr>
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
                      : "whitespace-nowrap pr-4 text-right"
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
