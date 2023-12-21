import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import Skeleton from "react-loading-skeleton";

import { API_URL } from "@/env";
import { type ApiMarket, type TradeHistory } from "@/types/api";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";

import { TokenSymbol } from "../TokenSymbol";

const columnHelper = createColumnHelper<TradeHistory>();

export const TradeHistoryTable: React.FC<{
  className?: string;
  marketData: ApiMarket;
  marketId: number;
}> = ({ className, marketData, marketId }) => {
  const { base, quote } = marketData;
  const baseSymbol = base?.symbol;
  const quoteSymbol = quote?.symbol;

  const { data, isLoading } = useQuery<TradeHistory[]>(
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
        cell: (info) => {
          const price = info.getValue();
          return toDecimalPrice({
            price,
            marketData,
          }).toNumber();
        },
        header: () => (
          <span className="flex items-baseline gap-2 whitespace-nowrap pt-[11px] md:pt-[2px]">
            PRICE <TokenSymbol symbol={quoteSymbol} smallSymbol />
          </span>
        ),
      }),
      columnHelper.accessor("size", {
        cell: (info) => {
          const size = info.getValue();
          return toDecimalSize({
            size,
            marketData,
          }).toNumber();
        },
        header: () => (
          <span className="flex items-baseline gap-2 whitespace-nowrap pt-[11px] md:pt-[2px]">
            AMOUNT <TokenSymbol symbol={baseSymbol} smallSymbol />
          </span>
        ),
      }),
      columnHelper.accessor("time", {
        cell: (info) => {
          const timestampString = info.getValue();
          const timestamp = new Date(timestampString);
          const currentTime = new Date();
          const timeDifference = currentTime.getTime() - timestamp.getTime();
          const hoursDifference = timeDifference / (1000 * 60 * 60);
          // If the trade is from more than 24 hours ago, show the date
          if (hoursDifference < 24)
            return (
              <span className="whitespace-nowrap">
                {new Date(timestampString).toLocaleString("en", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            );
          return (
            <div className="flex flex-col">
              <span>
                {new Date(timestampString).toLocaleString("en", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </span>
              <span>
                {new Date(timestampString).toLocaleString("en", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
          );
        },
        header: () => (
          <span className="flex items-baseline justify-end gap-2 whitespace-nowrap pt-[11px] md:pt-[2px]">
            TIME
          </span>
        ),
      }),
    ],
    data: data || [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className={`w-full table-fixed ${className || ""}`}>
      <thead className="sticky top-0 bg-neutral-800 bg-noise md:top-[40px]">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr
            className="text-left font-roboto-mono text-sm text-neutral-500 [&>th]:font-light"
            key={headerGroup.id}
          >
            {headerGroup.headers.map((header, i) => (
              <th
                className={`text-xs ${
                  i === 0
                    ? "pl-[17.03px] text-left"
                    : i === 1
                    ? "pl-[13.03px] text-left"
                    : "pr-[12.61px] text-right"
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
        <tr className="sticky top-[31px]  bg-neutral-800 bg-noise md:top-[60px]">
          <td colSpan={7} className="pb-[6.53px] pt-[7px] md:pt-[12.56px]">
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
                      ? "pl-[17.03px] text-left"
                      : i === 1
                      ? "pl-[13.03px] text-left"
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
                  className={`align-bottom text-xs ${
                    i === 0
                      ? `pl-[17.03px] text-left ${
                          cell.row.original.maker_side
                            ? "text-green"
                            : "text-red"
                        }`
                      : i === 1
                      ? "pl-[13.03px] text-left"
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
