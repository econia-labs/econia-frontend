import { Tab } from "@headlessui/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortDirection,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useWindowSize } from "@uidotdev/usehooks";
import { useRouter } from "next/router";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { RecognizedIcon } from "@/components/icons/RecognizedIcon";
import { MarketIconPair } from "@/components/MarketIconPair";
import { useAptos } from "@/contexts/AptosContext";
import { type ApiMarket, type MarketSelectData } from "@/types/api";
import {
  toDecimalPrice,
  //  toDecimalSize
} from "@/utils/econia";
import { plusMinus } from "@/utils/formatter";
import { TypeTag } from "@/utils/TypeTag";

import { useAllMarketsData } from ".";

const colWidths = [
  230,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
] as const;

const columnHelper = createColumnHelper<MarketSelectData>();

/**
 * @param onSelectMarket - if provided, will call this function instead of routing to the market page
 */
export const SelectMarketContent: React.FC<{
  allMarketData: ApiMarket[];
  onSelectMarket?: (marketId: number, name?: string) => void;
}> = ({ allMarketData, onSelectMarket }) => {
  const router = useRouter();
  const { data: marketsData } = useAllMarketsData();
  const [filter, setFilter] = useState("");
  const { coinListClient } = useAptos();

  const [selectedTab, setSelectedTab] = useState(0);

  const [sorting, setSorting] = useState<SortingState>([]);
  const { width } = useWindowSize();

  const marketDataWithNames: MarketSelectData[] = useMemo(() => {
    if (!marketsData) return [];
    return marketsData.map((market) => {
      const {
        base_account_address,
        base_module_name,
        base_struct_name,
        quote_account_address,
        quote_module_name,
        quote_struct_name,
      } = market;

      const baseAssetIcon = coinListClient.getCoinInfoByFullName(
        TypeTag.fromString(
          `${base_account_address}::${base_module_name}::${base_struct_name}`,
        ).toString(),
      )?.logo_url;
      const quoteAssetIcon = coinListClient.getCoinInfoByFullName(
        TypeTag.fromString(
          `${quote_account_address}::${quote_module_name}::${quote_struct_name}`,
        ).toString(),
      )?.logo_url;

      const marketWithNames = allMarketData.find(
        ({ market_id }) => market_id === market.market_id,
      );
      if (marketWithNames == null) {
        return market;
      } else {
        return {
          ...market,
          name: marketWithNames.name,
          baseAssetIcon,
          quoteAssetIcon,
        };
      }
    });
  }, [allMarketData, coinListClient, marketsData]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        id: "name",
        header: () => <div className="pl-8">Name</div>,
        cell: (info) => {
          const { baseAssetIcon, quoteAssetIcon } = info.row.original;
          return (
            <div className="flex pl-8">
              <MarketIconPair
                zIndex={1}
                baseAssetIcon={baseAssetIcon}
                quoteAssetIcon={quoteAssetIcon}
              />
              <p className="my-auto ml-2 text-base font-medium">
                {info.getValue()}
              </p>
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("last_fill_price_24hr", {
        id: "last_fill_price_24hr",
        header: "price",
        cell: (info) => {
          const price = info.getValue();
          const quoteSymbol = info.row.original.name?.split("-")[1] ?? "-";
          if (price == null) return `- ${quoteSymbol}`;
          const selectedMarket = allMarketData.find(
            ({ market_id }) => market_id === info.row.original.market_id,
          );
          if (selectedMarket == null) return `- ${quoteSymbol}`;
          const priceToDecimal = toDecimalPrice({
            price,
            marketData: selectedMarket,
          }).toNumber();
          return `${priceToDecimal} ${quoteSymbol}`;
        },
        enableSorting: false,
      }),
      columnHelper.accessor("base_volume_24h", {
        id: "base_volume_24h",
        header: "24h volume",
        cell: (info) => {
          const baseVolume = info.getValue();
          const baseSymbol = info.row.original.name?.split("-")[0] ?? "-";
          if (baseVolume == null) return `- ${baseSymbol}`;

          const volume = baseVolume / (10 ^ 3);
          return `${volume.toLocaleString(undefined, {
            maximumFractionDigits: volume < 10000 ? 2 : 0,
          })} ${baseSymbol}`;
        },
      }),
      columnHelper.accessor("price_change_as_percent_24hr", {
        id: "price_change_as_percent_24hr",
        header: () => <div className="text-center">24h change</div>,
        cell: (info) => {
          const change = info.getValue();
          if (change == null) return "-";
          return (
            <p
              className={
                "text-center " + (change < 0 ? "text-red" : "text-green")
              }
            >
              {plusMinus(change)}
              {change.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
            </p>
          );
        },
      }),
      columnHelper.accessor("is_recognized", {
        id: "is_recognized",
        header: () => (
          <div className="flex items-center justify-center">Recognized</div>
        ),
        cell: (info) => {
          const isRecognized = info.getValue();
          return (
            <div className="flex items-center justify-center">
              {isRecognized ? (
                <RecognizedIcon className="m-auto h-5 w-5" />
              ) : (
                <></>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("market_id", {
        id: "market_id",
        header: () => <div className="pr-8 text-right">Market ID</div>,
        cell: (info) => {
          const marketId = info.getValue();
          return (
            <div className="flex pr-6">
              <span className="m-auto">{marketId}</span>
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [allMarketData],
  );

  const sortLabel = useMemo(() => {
    const map = new Map<SortDirection | false, ReactNode>();
    map.set(false, null);
    map.set(
      "asc",
      <ChevronUpIcon className="absolute top-[23px] ml-0.5 inline-block h-4 w-4 translate-y-1/2" />,
    );
    map.set(
      "desc",
      <ChevronDownIcon className="absolute top-[23px] ml-0.5 inline-block h-4 w-4 translate-y-1/2" />,
    );
    return map;
  }, []);

  const table = useReactTable({
    columns,
    data: marketDataWithNames || [],
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    if (width === null) return;

    const nameCol = table.getColumn("name");
    const priceCol = table.getColumn("last_fill_price_24hr");
    const baseVolumeCol = table.getColumn("base_volume_24h");
    const priceChangeCol = table.getColumn("price_change_as_percent_24hr");
    const isRecognizedCol = table.getColumn("is_recognized");
    const marketIdCol = table.getColumn("market_id");

    table.getAllColumns().map((col) => col.toggleVisibility(false));

    if (width >= 640) {
      [nameCol, priceCol, baseVolumeCol].map((col) =>
        col?.toggleVisibility(true),
      );
    }

    if (width >= 768) {
      isRecognizedCol?.toggleVisibility(true);
    }

    if (width >= 1024) {
      [priceChangeCol, marketIdCol].map((col) => col?.toggleVisibility(true));
    }
  }, [table, width]);

  return (
    <div className="flex max-h-[560px] min-h-[560px] w-full flex-col items-center overflow-y-hidden">
      <Tab.Group
        onChange={(index) => {
          setSelectedTab(index);
          setSorting([]);
        }}
      >
        <div className="w-full px-8 pt-8">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-neutral-500" />
            </div>
            <input
              type="text"
              id="voice-search"
              className="block w-full border border-neutral-600 bg-transparent p-2.5 pl-10 font-roboto-mono text-sm text-neutral-500 outline-none"
              placeholder="Search markets"
              required
              onChange={(e) => {
                setFilter(e.target.value);
              }}
              value={filter}
            />
          </div>
          <Tab.List className="mt-4 w-full">
            <Tab className="w-1/2 border-b border-b-neutral-600 py-4 text-center font-jost font-bold text-neutral-600 outline-none ui-selected:border-b-white ui-selected:text-white">
              Recognized
            </Tab>
            <Tab className="w-1/2 border-b border-b-neutral-600 py-4 text-center font-jost font-bold text-neutral-600 outline-none ui-selected:border-b-white ui-selected:text-white">
              All Markets
            </Tab>
          </Tab.List>
        </div>

        <Tab.Panels className="scrollbar-none w-full overflow-y-scroll">
          <table className="w-full table-fixed">
            <thead className="sticky top-0 z-10 h-16 bg-neutral-800 bg-noise pt-4">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr className="m-auto h-8 pt-4" key={headerGroup.id}>
                  {headerGroup.headers.map((header, i) => {
                    if (header.id === "name") {
                      if (
                        filter === "" &&
                        header.column.getFilterValue() != undefined
                      ) {
                        header.column.setFilterValue(undefined);
                      }
                      if (
                        filter !== "" &&
                        header.column.getFilterValue() !== filter
                      ) {
                        header.column.setFilterValue(filter);
                      }
                    }

                    if (header.id === "is_recognized") {
                      if (
                        selectedTab === 0 &&
                        header.column.getFilterValue() == undefined
                      ) {
                        header.column.setFilterValue(true);
                      }
                      if (
                        selectedTab === 1 &&
                        header.column.getFilterValue() === true
                      ) {
                        header.column.setFilterValue(undefined);
                      }
                    }

                    return (
                      <th
                        className={`cursor-pointer select-none pt-4 text-left font-roboto-mono text-sm font-light uppercase text-neutral-500`}
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ width: colWidths[i] }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {sortLabel.get(header.column.getIsSorted())}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {allMarketData.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex h-[150px] flex-col items-center justify-center text-sm font-light uppercase text-neutral-500">
                      No markets to show
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    className="h-9 cursor-pointer hover:bg-neutral-600/30"
                    key={row.id}
                    onClick={() => {
                      const marketId = row.original.market_id;
                      if (onSelectMarket != null) {
                        onSelectMarket(marketId, marketId.toString());
                      }
                      router.push(`/market/${marketId}`);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        className="py-[10px] text-left font-roboto-mono text-sm font-light text-white"
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
