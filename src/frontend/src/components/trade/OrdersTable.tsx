import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortDirection,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { type ReactNode, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { type ApiMarket, type ApiOrder } from "@/types/api";

import bg from "../../../public/bg.png";
import { ConnectedButton } from "../ConnectedButton";
import { API_URL } from "@/env";

const columnHelper = createColumnHelper<ApiOrder>();

export const OrdersTable: React.FC<{
  className?: string;
  market_id: number;
  marketData: ApiMarket;
}> = ({ className, market_id, marketData }) => {
  const { base, quote } = marketData;
  const { decimals: baseDecimals, symbol: baseSymbol } = base;
  const { decimals: quoteDecimals, symbol: quoteSymbol } = quote;
  const { connected, account } = useWallet();

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const { data, isLoading } = useQuery<ApiOrder[]>(
    ["useUserOrders", account?.address],
    async () => {
      if (!account) return [];
      const limit = 100;
      const fetchPromises = [
        fetch(
          `${API_URL}/limit_orders?order_status=eq.open&user=eq.${account.address}&market_id=eq.${market_id}&limit=${limit}`,
        ),
        fetch(
          `${API_URL}/market_orders?order_status=eq.open&user=eq.${account.address}&market_id=eq.${market_id}&limit=${limit}`,
        ),
        fetch(
          `${API_URL}/swap_orders?order_status=eq.open&signing_account=eq.${account.address}&market_id=eq.${market_id}&limit=${limit}`,
        ),
      ];
      const [response1, response2, response3] = await Promise.all(
        fetchPromises,
      );
      const limitOrders = await response1.json();
      const marketOrders = await response2.json();
      const swapOrders = await response3.json();
      const combinedData = [...limitOrders, ...marketOrders, ...swapOrders];
      return combinedData;
    },
  );

  const sortLabel = useMemo(() => {
    const map = new Map<SortDirection | false, ReactNode>();
    map.set(false, null);
    map.set(
      "asc",
      <ChevronUpIcon className="absolute top-0 ml-0.5 inline-block h-4 w-4 translate-y-1/2" />,
    );
    map.set(
      "desc",
      <ChevronDownIcon className="absolute top-0 ml-0.5 inline-block h-4 w-4 translate-y-1/2" />,
    );
    return map;
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("created_at", {
        header: () => <span className="pl-4">Time Placed</span>,
        cell: (info) => (
          <span className="pl-4 text-neutral-500">
            {new Date(info.getValue()).toLocaleString("en-US", {
              month: "numeric",
              day: "2-digit",
              year: "2-digit",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              hour12: true,
            })}
          </span>
        ),
      }),
      columnHelper.accessor("order_type", {
        header: "Type",
        cell: (info) => info.getValue().toUpperCase() || "N/A",
      }),
      columnHelper.accessor("side", {
        cell: (info) => {
          if (info.getValue()) return info.getValue().toUpperCase();
          const { direction } = info.row.original;
          if (direction) return direction === "buy" ? "BID" : "ASK";
        },
      }),
      columnHelper.accessor("price", {
        header: "Limit price",
        cell: (info) => {
          const price = info.getValue();
          if (price) {
            return `${price / Math.pow(10, quoteDecimals)} ${quoteSymbol}`;
          } else {
            return "N/A";
          }
        },
      }),
      columnHelper.display({
        header: "AVG EXECUTION PRICE",
        cell: () => "N/A",
      }),
      columnHelper.accessor("remaining_size", {
        header: "Remaining size",
        cell: (info) =>
          `${info.getValue() / Math.pow(10, baseDecimals)} ${baseSymbol}`,
      }),
      columnHelper.accessor("total_filled", {
        header: "Total",
        cell: (info) => {
          const total = info.getValue();
          return total
            ? `${total / Math.pow(10, quoteDecimals)} ${quoteSymbol}`
            : "N/A";
        },
      }),
      columnHelper.display({
        header: "Total volume",
        cell: () => "N/A",
      }),
      columnHelper.accessor("order_status", {
        header: "Status",
        cell: (info) => {
          const value = info.getValue();
          if (value === "open") {
            return <span className="text-green">{value.toUpperCase()}</span>;
          }
          // TODO colors for other order statuses?
          return value.toUpperCase();
        },
      }),
    ],
    [marketData],
  );

  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="scrollbar-none h-[200px] overflow-y-auto">
      <table
        className={"w-full table-auto" + (className ? ` ${className}` : "")}
      >
        <thead
          className="sticky top-0 h-8  bg-[#020202] shadow-[inset_0_-1px_0_theme(colors.neutral.600)]"
          style={{
            backgroundImage: `url(${bg.src})`,
          }}
        >
          <tr>
            {table.getFlatHeaders().map((header) => (
              <th
                className="cursor-pointer select-none py-0.5 text-left font-roboto-mono text-sm font-light uppercase text-neutral-500 shadow-[inset_0_-1px_0_theme(colors.neutral.600)]"
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                {sortLabel.get(header.column.getIsSorted())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!connected ? (
            <tr>
              <td colSpan={7}>
                <div className="flex h-[150px] flex-col items-center justify-center">
                  <ConnectedButton />
                </div>
              </td>
            </tr>
          ) : isLoading || !data ? (
            <>
              {/* temporarily removing skeletong to help UX and reduce glitchyness. see: ECO-230 */}
              {/* <tr>
                {table.getAllColumns().map((column, i) => (
                  <td
                    className={`${
                      i === 0
                        ? "pl-4 text-left text-neutral-500"
                        : i === 6
                        ? ""
                        : ""
                    }`}
                    key={column.id}
                  >
                    <div className={"pr-3"}>
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
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    className="h-7 py-0.5 text-left font-roboto-mono text-sm font-light text-white"
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
    </div>
  );
};
