import { ChevronDownIcon } from "@heroicons/react/20/solid";
import React from "react";

import { Button } from "@/components/Button";
import { useAptos } from "@/contexts/AptosContext";
import { type ApiMarket } from "@/types/api";
import { fromRawCoinAmount } from "@/utils/coin";
import { TypeTag } from "@/utils/TypeTag";

import { type MarketAccountData } from "./AccountDetailsModal";
import { RecognizedIcon } from "./icons/RecognizedIcon";
import { MarketIconPair } from "./MarketIconPair";

export const MarketAccountCard: React.FC<{
  onDepositWithdrawClick: (selected: ApiMarket) => void;
  marketAccountData: MarketAccountData;
}> = ({ onDepositWithdrawClick, marketAccountData }) => {
  const {
    market_id: marketID,
    base_available,
    quote_available,
    markets,
  } = marketAccountData;
  const {
    base_symbol,
    quote_symbol,
    base_decimals,
    quote_decimals,
    base_account_address,
    quote_account_address,
    base_name,
    quote_name,
    base_module_name,
    quote_module_name,
    base_struct_name,
    quote_struct_name,
    lot_size,
    tick_size,
    base_name_generic,
    underwriter_id,
    min_size,
    is_recognized,
  } = markets || {
    base_symbol: "-",
    quote_symbol: "-",
    lot_size: 0,
    tick_size: 0,
  };
  const [expanded, setExpanded] = React.useState(false);
  const toggleExpanded = () => setExpanded(!expanded);
  const { coinListClient } = useAptos();

  const DEFAULT_TOKEN_ICON = "/tokenImages/default.svg";
  const baseTokenInfo = coinListClient.getCoinInfoByFullName(
    TypeTag.fromString(
      `${base_account_address}::${base_module_name}::${base_struct_name}`,
    ).toString(),
  );

  const quoteTokenInfo = coinListClient.getCoinInfoByFullName(
    TypeTag.fromString(
      `${quote_account_address}::${quote_module_name}::${quote_struct_name}`,
    ).toString(),
  );

  const baseAssetIcon = marketAccountData
    ? baseTokenInfo?.logo_url
    : DEFAULT_TOKEN_ICON;
  const quoteAssetIcon = marketAccountData
    ? quoteTokenInfo?.logo_url
    : DEFAULT_TOKEN_ICON;
  console.log(
    coinListClient.getCoinInfoByFullName(
      TypeTag.fromString(
        `${quote_account_address}::${quote_module_name}::${quote_struct_name}`,
      ).toString(),
    ),
  );

  const market: ApiMarket = {
    market_id: marketID,
    name: base_symbol + "-" + quote_symbol,
    base: {
      account_address: base_account_address,
      module_name: base_module_name,
      struct_name: base_struct_name,
      symbol: base_symbol,
      name: base_name,
      decimals: base_decimals,
      logo_url: baseAssetIcon,
    },
    base_name_generic,
    quote: {
      account_address: quote_account_address,
      module_name: quote_module_name,
      struct_name: quote_struct_name,
      symbol: quote_symbol,
      name: quote_name,
      decimals: quote_decimals,
      logo_url: quoteAssetIcon,
    },
    lot_size: lot_size,
    tick_size: tick_size,
    min_size,
    underwriter_id,
    created_at: "",
    recognized: is_recognized,
  };

  return (
    <div className="mb-4 flex h-[107px] w-[378px] items-center justify-between gap-11 border-[1px] border-neutral-600 pb-[16px] pl-5 pr-14 pt-[15px]">
      {/* left side */}
      <div>
        {/* input copy row 1 */}
        <div className="mb-[9px] flex items-center">
          <div className="text-white">
            <div className="flex items-center font-bold">
              <MarketIconPair
                size={16}
                baseAssetIcon={baseAssetIcon}
                quoteAssetIcon={quoteAssetIcon}
              />
              {base_symbol}/{quote_symbol}
              <RecognizedIcon className="ml-1 inline-block h-[9px] w-[9px] text-center" />
            </div>
            {/* row2 within row1 */}
            <div>
              <div
                className="ml-[27.42px] text-left text-xs uppercase text-neutral-500"
                onClick={toggleExpanded}
              >
                {baseTokenInfo?.source || "native"} |{" "}
                {quoteTokenInfo?.source || "LAYERZERO"} {/** TODO */}
                {/* <ChevronDownIcon
                  className={`inline-block h-4 w-4 text-center duration-150 ${
                    expanded && "rotate-180"
                  }`}
                /> */}
              </div>
              {/* expand container */}
              {/* <div className="relative overflow-hidden">
                <div
                  className={`reveal-container ml-[27.42px] ${
                    expanded && "revealed"
                  } line-clamp-[10px] text-left text-[8px] text-neutral-500`}
                >
                  <div>MARKET ID: {marketID}</div>
                  <div>LOT SIZE: {lot_size.toLocaleString()}</div>
                  <div>TICK SIZE: {tick_size.toLocaleString()}</div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
        {/* row 2 */}
        <Button
          variant="secondary"
          onClick={() => {
            onDepositWithdrawClick(market);
          }}
          className={
            "flex items-center !px-[18px] pt-[10px] !text-xs uppercase !leading-[11.5px]"
          }
        >
          Deposit/withdraw
        </Button>
      </div>

      {/* right side */}
      <div>
        <div className="text-left">
          <span className="font-roboto-mono text-xs font-light text-neutral-500">
            {base_symbol} BALANCE
          </span>
          <p className="font-roboto-mono text-[13px] font-medium text-white">
            {fromRawCoinAmount(base_available || 0, base_decimals || 0)}
          </p>
        </div>
        <div className="text-left">
          <span className="font-roboto-mono text-xs font-light text-neutral-500">
            {quote_symbol} BALANCE
          </span>
          <p className="font-roboto-mono text-[13px] font-medium text-white">
            {fromRawCoinAmount(quote_available || 0, quote_decimals || 0)}
          </p>
        </div>
      </div>
    </div>
  );
};
