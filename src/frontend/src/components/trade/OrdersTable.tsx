import { type InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { type Side } from "@econia-labs/sdk/dist/src/order";
import { sideToBoolean } from "@econia-labs/sdk/dist/src/utils";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

import Skeleton from "@/components/Skeleton";
import { useAptos } from "@/contexts/AptosContext";
import { API_URL, ECONIA_ADDR } from "@/env";
import { type ApiMarket, type ApiOrder } from "@/types/api";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";

import { BaseModal } from "../modals/BaseModal";
import { OrderDetailsModalContent } from "./OrderDetailsModalContent";

const columnHelper = createColumnHelper<ApiOrder>();

export const OrdersTable: React.FC<{
  className?: string;
  market_id: number;
  marketData: ApiMarket;
}> = ({ className, market_id, marketData }) => {
  const { signAndSubmitTransaction } = useAptos();
  const { base, quote, name } = marketData;
  const { symbol: baseSymbol } = base;
  const { symbol: quoteSymbol } = quote;
  const { connected, account } = useWallet();

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCancelingOrder, setIsCancelingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const { data, isLoading, refetch } = useQuery<ApiOrder[]>(
    ["useUserOrders", market_id, account?.address],
    async () => {
      if (!account) return [];
      const limit = 100;
      const response = await fetch(
        `${API_URL}/orders?user=eq.${account.address}&order=created_at.desc&market_id=eq.${market_id}&limit=${limit}`,
      );
      const responseText = await response.text();
      const orders = JSON.parse(
        responseText.replace(/"order_id":(\d+)/g, '"order_id":"$1"'),
      );
      return orders;
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchInterval: 10 * 1000,
    },
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  }, []);

  const cancelOrder = useCallback(
    async (orderInfo: ApiOrder) => {
      try {
        setIsCancelingOrder(true);
        const { direction, order_id } = orderInfo;
        let side = direction;
        switch (direction) {
          case "buy":
            side = "bid";
            break;
          case "sell":
            side = "ask";
            break;
          default:
            side = direction;
            break;
        }

        const payload: InputEntryFunctionData = {
          functionArguments: [
            market_id.toString(),
            sideToBoolean(side as Side),
            order_id,
          ],
          function: `${ECONIA_ADDR}::market::cancel_order_user`,
        };
        await signAndSubmitTransaction({ data: payload });
        refetch();

        // close modal if it's open
        if (isModalOpen) closeModal();
      } catch (error) {
        console.error("Error while cancelling order:", error);
      } finally {
        setIsCancelingOrder(false);
      }
    },
    [closeModal, isModalOpen, market_id, refetch, signAndSubmitTransaction],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("created_at", {
        header: () => <span className="pl-4">Time Placed</span>,
        cell: (info) => (
          <span className="flex gap-2 pl-4 text-neutral-500">
            <span>
              {new Date(info.getValue()).toLocaleString("en-US", {
                month: "numeric",
                day: "2-digit",
                year: "2-digit",
              })}
            </span>
            <span>
              {new Date(info.getValue()).toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: false,
              })}
            </span>
          </span>
        ),
        size: 174.19,
      }),
      columnHelper.display({
        header: "Name",
        cell: () => name,
        size: 105,
      }),
      columnHelper.accessor("order_type", {
        header: "Type",
        cell: (info) => info.getValue().toUpperCase() || "-",
        size: 75,
      }),
      columnHelper.accessor("direction", {
        header: "Side",
        cell: (info) => {
          const direction = info.getValue();
          if (direction === "bid" || direction === "buy") {
            return <span className="text-green">BID</span>;
          } else {
            return <span className="text-red">ASK</span>;
          }
        },
        size: 60,
      }),
      columnHelper.accessor("price", {
        header: "Limit price",
        cell: (info) => {
          const price = info.getValue();
          if (price !== null && typeof price === "number") {
            return (
              <>
                <span>
                  {toDecimalPrice({
                    price,
                    marketData,
                  }).toNumber()}
                </span>
                <span className="ml-2 text-neutral-600">{quoteSymbol}</span>
              </>
            );
          } else {
            return "";
          }
        },
        size: 112,
      }),
      columnHelper.accessor("average_execution_price", {
        header: "AVG EXEC. PRICE",
        cell: (info) => {
          const avg = info.getValue();
          if (avg !== null) {
            return (
              <>
                <span>
                  {toDecimalPrice({
                    price: avg,
                    marketData,
                  }).toNumber()}
                </span>
                <span className="ml-2 text-neutral-600">{quoteSymbol}</span>
              </>
            );
          } else {
            return "";
          }
        },
        size: 142,
      }),
      columnHelper.accessor("remaining_size", {
        header: "RMNG SIZE",
        cell: (info) => {
          const remaining = info.getValue();
          return (
            <>
              <span>
                {toDecimalSize({
                  size: remaining,
                  marketData,
                }).toNumber()}
              </span>
              <span className="ml-2 text-neutral-600">{baseSymbol}</span>
            </>
          );
        },
        size: 112,
      }),
      columnHelper.accessor("total_filled", {
        header: "Total",
        cell: (info) => {
          const total = info.getValue();
          if (total !== null)
            return (
              <>
                <span>
                  {toDecimalSize({
                    size: total,
                    marketData,
                  }).toNumber()}
                </span>
                <span className="ml-2 text-neutral-600">{baseSymbol}</span>
              </>
            );
          return "";
        },
        size: 112,
      }),
      columnHelper.display({
        header: "Total VOL.",
        cell: (info) => {
          const row = info.row.original;
          const { total_filled, average_execution_price } = row;
          if (!total_filled || !average_execution_price) return "";
          const convertedAvgPrice = toDecimalPrice({
            price: average_execution_price,
            marketData,
          }).toNumber();
          const convertedTotalFilled = toDecimalSize({
            size: total_filled,
            marketData,
          }).toNumber();
          const totalVolume = convertedTotalFilled * convertedAvgPrice;
          return `${totalVolume.toLocaleString(undefined, {
            maximumFractionDigits: 5,
          })} ${quoteSymbol}`;
        },
        size: 142,
      }),
      columnHelper.accessor("order_status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          let className = "";
          switch (status) {
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
          return <span className={className}>{status.toUpperCase()}</span>;
        },
        size: 97,
      }),
      columnHelper.display({
        header: "Cancel",
        cell: (info) => {
          const orderInfo = info.row.original;
          const { order_status: status } = orderInfo;
          if (status !== "open") return "";
          return (
            <button
              className="text-red hover:text-[#DC2B2B]"
              onClick={(e) => {
                e.stopPropagation();
                cancelOrder(orderInfo);
              }}
            >
              CANCEL
            </button>
          );
        },
        size: 60,
      }),
    ],
    [baseSymbol, cancelOrder, marketData, name, quoteSymbol],
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
    <div className="scrollbar-none w-full grow overflow-auto">
      <BaseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        showCloseButton={true}
        showBackButton={false}
        className="!w-[480px] !p-0 font-jost text-white"
      >
        <OrderDetailsModalContent
          orderDetails={selectedOrder}
          baseSymbol={baseSymbol}
          quoteSymbol={quoteSymbol}
          marketData={marketData}
          cancelOrder={cancelOrder}
          loading={isCancelingOrder}
        />
      </BaseModal>
      <table
        className={"w-full table-fixed" + (className ? ` ${className}` : "")}
      >
        <thead className="sticky top-0 h-[30px] bg-neutral-800 bg-noise">
          <tr className="h-[30px]">
            {table.getFlatHeaders().map((header) => (
              <th
                className="cursor-pointer select-none text-left font-roboto-mono text-xs font-normal uppercase tracking-[0.24px] text-neutral-500 transition-all hover:text-blue"
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                style={{
                  width: header.getSize(),
                }}
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
          <tr>
            {table.getFlatHeaders().map((header) => (
              <td className="p-0" key={header.id}>
                <div className="h-[1px] w-full bg-neutral-600"></div>
              </td>
            ))}
          </tr>
        </thead>

        <tbody>
          {!connected ? (
            <></>
          ) : isLoading || !data ? (
            <>
              <tr>
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
              </tr>
            </>
          ) : (
            data.length !== 0 &&
            table.getRowModel().rows.map((row) => (
              <tr
                className="cursor-pointer transition-colors hover:bg-neutral-600/30"
                key={row.id}
                onClick={() => {
                  setIsModalOpen(true);
                  setSelectedOrder(row.original);
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    className="h-7 py-2 text-left font-roboto-mono text-xs font-normal leading-[18px] tracking-[0.24px] text-white"
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
      {!isLoading && data && data.length === 0 && (
        <div className="flex h-[calc(100%-37.52px)] flex-col items-center justify-center font-roboto-mono text-xs font-light uppercase tracking-[0.2px] text-neutral-500">
          no orders to show
        </div>
      )}
    </div>
  );
};
