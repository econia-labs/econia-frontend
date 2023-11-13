import { entryFunctions, type order } from "@econia-labs/sdk";
import { useForm } from "react-hook-form";

import { Button } from "@/components/Button";
import { ConnectedButton } from "@/components/ConnectedButton";
import { useAptos } from "@/contexts/AptosContext";
import { API_URL, CUSTODIAN_ID, ECONIA_ADDR } from "@/env";
import { useMarketAccountBalance } from "@/hooks/useMarketAccountBalance";
import { type ApiMarket } from "@/types/api";
import { type Side } from "@/types/global";
import { toRawCoinAmount } from "@/utils/coin";
import { TypeTag } from "@/utils/TypeTag";

import { OrderEntryInfo } from "./OrderEntryInfo";
import { OrderEntryInputWrapper } from "./OrderEntryInputWrapper";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useBalance } from "@/hooks/useBalance";
import { usePriceStats } from "@/features/hooks";
import { toDecimalPrice } from "@/utils/econia";
type MarketFormValues = {
  size: string;
};

export const MarketOrderEntry: React.FC<{
  marketData: ApiMarket;
  side: Side;
}> = ({ marketData, side }) => {
  const { signAndSubmitTransaction, account, aptosClient } = useAptos();
  const {
    handleSubmit,
    register,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<MarketFormValues>();

  // const baseBalance = useMarketAccountBalance(
  //   account?.address,
  //   marketData.market_id,
  //   marketData.base,
  // );
  // const quoteBalance = useMarketAccountBalance(
  //   account?.address,
  //   marketData.market_id,
  //   marketData.quote,
  // );

  const { balance } = useBalance(marketData);

  const watchSize = watch("size", "0.0");
  const {
    data: { last_price },
  } = usePriceStats();
  const { data: takerFeeDivisor } = useQuery(["takerFeeDivisor"], async () => {
    try {
      const rs = await aptosClient.view({
        function: `${ECONIA_ADDR}::incentives::get_taker_fee_divisor`,
        arguments: [],
        type_arguments: [],
      });
      return Number(rs[0]);
    } catch (e) {
      return 2000; // default
    }
  });

  const estimateFee = useMemo(() => {
    const totalSize = toDecimalPrice({ price: Number(last_price), marketData }).toNumber() * Number(watchSize);
    if (!takerFeeDivisor || !totalSize) {
      return "--";
    }
    // check order book
    const takerSize = Number(totalSize) * 1;
    return `${(takerSize * 1) / takerFeeDivisor}`;
  }, [takerFeeDivisor, last_price, watchSize]);

  const onSubmit = async ({ size }: MarketFormValues) => {
    if (marketData.base == null) {
      throw new Error("Markets without base coin not supported");
    }

    if (
      !balance ||
      balance?.base_available == null ||
      balance?.base_available == null
    ) {
      throw new Error("Could not read wallet balances");
    }

    const rawSize = toRawCoinAmount(size, marketData.base.decimals);

    // check that size satisfies lot size
    if (!rawSize.modulo(marketData.lot_size).eq(0)) {
      setError("size", { message: "INVALID LOT SIZE" });
      return;
    }

    // check that size satisfies min size
    if (rawSize.lt(marketData.min_size)) {
      setError("size", { message: "SIZE TOO SMALL" });
      return;
    }

    const rawBaseBalance = toRawCoinAmount(
      balance?.base_available,
      marketData.base.decimals,
    );

    // market sell -- make sure user has enough base balance
    if (side === "sell") {
      // check that user has sufficient base coins on ask
      if (rawBaseBalance.lt(rawSize)) {
        setError("size", { message: "INSUFFICIENT BALANCE" });
        return;
      }
    }

    const orderSideMap: Record<Side, order.Side> = {
      buy: "bid",
      sell: "ask",
    };
    const orderSide = orderSideMap[side];

    const payload = entryFunctions.placeMarketOrderUserEntry(
      ECONIA_ADDR,
      TypeTag.fromApiCoin(marketData.base).toString(),
      TypeTag.fromApiCoin(marketData.quote).toString(),
      BigInt(marketData.market_id), // market id
      "0x1", // TODO get integrator ID
      orderSide,
      BigInt(rawSize.div(marketData.lot_size).toString()),
      "abort", // TODO don't hardcode this either
    );

    await signAndSubmitTransaction({
      type: "entry_function_payload",
      ...payload,
    });
    // toast('Success')
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mx-4 flex flex-col">
        <OrderEntryInputWrapper
          startAdornment="Amount"
          endAdornment={marketData.base?.symbol}
        >
          <input
            type="number"
            step="any"
            placeholder="0.00"
            {...register("size", {
              required: "please input amount",
              min: 0,
            })}
            className="z-30 w-full bg-transparent pb-3 pl-14 pr-14 pt-3 text-right font-roboto-mono text-xs font-light text-neutral-400 outline-none"
          />
        </OrderEntryInputWrapper>
        <div className="relative mb-4">
          <p className="absolute text-xs text-red">
            {errors.size != null && errors.size.message}
          </p>
        </div>
      </div>
      <hr className="my-4 border-neutral-600" />
      <div className="mx-4 mb-4 flex flex-col gap-4">
        <OrderEntryInfo label="EST. FEE" value={estimateFee} />
        <ConnectedButton className="w-full">
          <Button
            variant={side === "buy" ? "green" : "red"}
            className={`w-full`}
          >
            {side === "buy" ? "Buy" : "Sell"} {marketData.base?.symbol}
          </Button>
        </ConnectedButton>
        <OrderEntryInfo
          label={`${marketData.base?.symbol} AVAILABLE`}
          value={`${balance?.base_available ? balance?.base_available : "--"} ${marketData.base?.symbol
            }`}
          className="cursor-pointer"
          onClick={() => {
            setValue(
              "size",
              balance?.base_available ? balance?.base_available.toString() : "",
            );
          }}
        />
        <OrderEntryInfo
          label={`${marketData.quote?.symbol} AVAILABLE`}
          value={`${balance?.quote_available ? balance.quote_available : "--"
            } ${marketData.quote?.symbol}`}
        />
      </div>
    </form>
  );
};
