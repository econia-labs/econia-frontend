import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { type Side } from "@econia-labs/sdk/dist/src/order";
import { sideToBoolean } from "@econia-labs/sdk/dist/src/utils";
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
import { type ReactNode, useCallback, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { useAptos } from "@/contexts/AptosContext";
import { API_URL, ECONIA_ADDR } from "@/env";
import { type ApiMarket, type ApiOrder } from "@/types/api";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";

import bg from "../../../public/bg.png";
import { ConnectedButton } from "../ConnectedButton";
import { BaseModal } from "../modals/BaseModal";
import { OrderDetailsModalContent } from "./OrderDetailsModalContent";

const columnHelper = createColumnHelper<ApiOrder>();

export const OrdersTable: React.FC<{
  className?: string;
  market_id: number;
  marketData: ApiMarket;
}> = ({ className, market_id, marketData }) => {
  const { signAndSubmitTransaction } = useAptos();
  const { base, quote } = marketData;
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
        responseText.replace(/"order_id":(\d+)/g, '"order_id":"$1"'), // convert order_id to string to avoid precision loss
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

        const payload = {
          arguments: [
            market_id.toString(),
            sideToBoolean(side as Side),
            order_id,
          ],
          function: `${ECONIA_ADDR}::market::cancel_order_user`,
          type_arguments: [],
        };
        await signAndSubmitTransaction({
          type: "entry_function_payload",
          ...payload,
        });
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
        size: 200,
      }),
      columnHelper.accessor("order_type", {
        header: "Type",
        cell: (info) => info.getValue().toUpperCase() || "-",
        size: 70,
      }),
      columnHelper.accessor("direction", {
        header: "Side",
        cell: (info) => {
          const direction = info.getValue();
          switch (direction) {
            case "buy":
              return "BID";
            case "sell":
              return "ASK";
            default:
              return direction.toUpperCase();
          }
        },
        size: 50,
      }),
      columnHelper.accessor("price", {
        header: "Limit price",
        cell: (info) => {
          const price = info.getValue();
          if (price) {
            return `${toDecimalPrice({
              price,
              marketData,
            }).toNumber()} ${quoteSymbol}`;
          } else {
            return "-";
          }
        },
      }),
      columnHelper.accessor("average_execution_price", {
        header: "AVG EXECUTION PRICE",
        cell: (info) => {
          const avg = info.getValue();
          if (avg) {
            return `${toDecimalPrice({
              price: avg,
              marketData,
            }).toNumber()} ${quoteSymbol}`;
          } else {
            return "-";
          }
        },
        size: 170,
      }),
      columnHelper.accessor("remaining_size", {
        header: "Remaining size",
        cell: (info) => {
          const remaining = info.getValue();
          return `${toDecimalSize({
            size: remaining,
            marketData,
          }).toNumber()} ${baseSymbol}`;
        },
      }),
      columnHelper.accessor("total_filled", {
        header: "Total",
        cell: (info) => {
          const total = info.getValue();
          return total
            ? `${toDecimalSize({
                size: total,
                marketData,
              }).toNumber()} ${baseSymbol}`
            : "-";
        },
      }),
      columnHelper.display({
        header: "Total volume",
        cell: (info) => {
          const row = info.row.original;
          const { total_filled, average_execution_price } = row;
          if (!total_filled || !average_execution_price) return "-";
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
        size: 90,
      }),
      columnHelper.display({
        header: "Cancel",
        cell: (info) => {
          const orderInfo = info.row.original;
          const { order_status: status } = orderInfo;
          if (status !== "open") return "N/A";
          return (
            <button
              className="text-red"
              onClick={(e) => {
                e.stopPropagation();
                cancelOrder(orderInfo);
              }}
            >
              Cancel
            </button>
          );
        },
        size: 60,
      }),
    ],
    [baseSymbol, cancelOrder, marketData, quoteSymbol],
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
    <div className="scrollbar-none grow overflow-auto">
      <BaseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        showCloseButton={true}
        showBackButton={false}
        className="!w-[700px] font-roboto-mono text-white"
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
        <thead
          className="sticky top-0 h-10 bg-[#020202] shadow-[inset_0_-1px_0_theme(colors.neutral.600)]"
          style={{
            backgroundImage: `url(${bg.src})`,
          }}
        >
          <tr>
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
        </thead>
        <tbody>
          {!connected ? (
            <></>
          ) : isLoading || !data ? (
            <>
              {/* temporarily removing skeletong to help UX and reduce glitchyness. see: ECO-230 */}
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
                className="cursor-pointer transition-colors hover:bg-neutral-700"
                key={row.id}
                onClick={() => {
                  setIsModalOpen(true);
                  setSelectedOrder(row.original);
                }}
              >
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
      {!isLoading && data && data.length === 0 && (
        <div className="flex h-[calc(100%-32px)] flex-col items-center justify-center font-roboto-mono text-[10px] font-light uppercase tracking-[0.2px] text-neutral-500">
          no orders to show
        </div>
      )}
    </div>
  );
};
