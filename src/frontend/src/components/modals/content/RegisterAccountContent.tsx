import { entryFunctions } from "@econia-labs/sdk";
import { toast } from "react-toastify";

import { Button } from "@/components/Button";
import { RecognizedIcon } from "@/components/icons/RecognizedIcon";
import { MarketIconPair } from "@/components/MarketIconPair";
import { NO_CUSTODIAN } from "@/constants";
import { useAptos } from "@/contexts/AptosContext";
import { ECONIA_ADDR } from "@/env";
import { type ApiMarket } from "@/types/api";
import { TypeTag } from "@/utils/TypeTag";

type RegisterAccountContentProps = {
  selectedMarket: ApiMarket;
  selectMarket: () => void;
  onAccountCreated?: (status: boolean) => void;
};

const DEFAULT_TOKEN_ICON = "/tokenImages/default.svg";

export const RegisterAccountContent: React.FC<RegisterAccountContentProps> = ({
  selectedMarket,
  selectMarket,
  onAccountCreated,
}) => {
  const { signAndSubmitTransaction, coinListClient } = useAptos();
  const { base, quote, recognized } = selectedMarket;
  const {
    account_address: base_account_address,
    struct_name: base_struct_name,
    module_name: base_module_name,
    symbol: base_symbol,
  } = base;
  const {
    account_address: quote_account_address,
    struct_name: quote_struct_name,
    module_name: quote_module_name,
    symbol: quote_symbol,
  } = quote;

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

  const baseAssetIcon = selectedMarket
    ? baseTokenInfo?.logo_url
    : DEFAULT_TOKEN_ICON;
  const quoteAssetIcon = selectedMarket
    ? quoteTokenInfo?.logo_url
    : DEFAULT_TOKEN_ICON;

  return (
    <div className="flex w-full flex-col items-center gap-[22.8px]">
      <p className="font-jost text-xl font-bold leading-5 text-white">
        Create Account
      </p>
      <p className="font-roboto-mono text-sm font-light text-neutral-100">
        You are about to open a market account for:
      </p>
      {selectedMarket && (
        <div
          className="flex h-[88px] w-[265px] items-center justify-center gap-[10px] border-[1px] border-neutral-600"
          onClick={selectMarket}
        >
          <MarketIconPair
            baseAssetIcon={baseAssetIcon}
            quoteAssetIcon={quoteAssetIcon}
          />
          <div className="flex flex-col items-start">
            <div className="flex items-center font-jost text-base font-bold leading-[30px] text-white">
              {base_symbol} | {quote_symbol}
              {recognized && (
                <RecognizedIcon className="ml-[10px] inline-block w-[9px] text-center" />
              )}
            </div>
            <div className="font-roboto-mono text-xs uppercase tracking-[0.24px] text-neutral-500">
              {baseTokenInfo?.source || "native"} |{" "}
              {quoteTokenInfo?.source || "LAYERZERO"}
            </div>
          </div>
        </div>
      )}
      <Button
        className="px-[72px] pb-[13px] pt-[15px] text-sm uppercase leading-[11.5px] tracking-[0.28px]"
        onClick={async () => {
          if (selectedMarket?.base == null) {
            toast.error("Generic markets not supported");
            console.warn("Generic markets not supported");
            return;
          }
          const payload = entryFunctions.registerMarketAccount(
            ECONIA_ADDR,
            TypeTag.fromApiCoin(selectedMarket.base).toString(),
            TypeTag.fromApiCoin(selectedMarket.quote).toString(),
            BigInt(selectedMarket.market_id),
            BigInt(NO_CUSTODIAN),
          );
          const res = await signAndSubmitTransaction({ data: payload });

          if (onAccountCreated) {
            onAccountCreated(res);
          }
        }}
        variant="primary"
      >
        Create Account
      </Button>
    </div>
  );
};
