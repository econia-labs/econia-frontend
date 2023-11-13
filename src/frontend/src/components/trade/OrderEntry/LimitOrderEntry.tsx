import { entryFunctions, type order } from "@econia-labs/sdk";
import BigNumber from "bignumber.js";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/Button";
import { ConnectedButton } from "@/components/ConnectedButton";
import { useAptos } from "@/contexts/AptosContext";
import { useOrderEntry } from "@/contexts/OrderEntryContext";
import { API_URL, CUSTODIAN_ID, ECONIA_ADDR } from "@/env";
import { useMarketAccountBalance } from "@/hooks/useMarketAccountBalance";
import { type ApiMarket } from "@/types/api";
import { type Side } from "@/types/global";
import { toRawCoinAmount } from "@/utils/coin";
import { TypeTag } from "@/utils/TypeTag";

import { OrderEntryInfo } from "./OrderEntryInfo";
import { OrderEntryInputWrapper } from "./OrderEntryInputWrapper";
import { useQuery } from "@tanstack/react-query";
import { fromDecimalPrice, toDecimalPrice } from "@/utils/econia";
import { useBalance } from "@/hooks/useBalance";
import { useOrderBookData, usePriceStats } from "@/features/hooks";
type LimitFormValues = {
  price: string | undefined;
  size: string;
  totalSize: string;
};
export const HI_PRICE = 4294967295;
export const MIN_PRICE = 1;

export const LimitOrderEntry: React.FC<{
  marketData: ApiMarket;
  side: Side;
}> = ({ marketData, side }) => {
  // const { price } = useOrderEntry();
  const {
    data: { last_price },
  } = usePriceStats();
  const { signAndSubmitTransaction, account, aptosClient } = useAptos();
  const {
    handleSubmit,
    register,
    formState,
    getValues,
    setValue,
    setError,
    watch,
  } = useForm<LimitFormValues>({
    // mode: "onBlur",
    defaultValues: {
      price: undefined,
    },
  });

  const { errors } = formState;
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

  const { balance } = useBalance(marketData);
  const watchPrice = watch("price", undefined);

  const watchSize = watch("size");

  useEffect(() => {
    if (last_price) {
      if (watchPrice === "" || watchPrice === undefined) {
        setValue("price", (last_price / 1000).toString());
      }
    }
  }, [last_price]);

  const { highestBid, lowestAsk } = useOrderBookData();

  const estimateFee = useMemo(() => {
    const totalSize = Number(watchPrice) * Number(watchSize);
    if (!takerFeeDivisor || !totalSize) {
      return "--";
    }
    if (watchPrice === undefined || !lowestAsk || !highestBid) {
      return "--";
    }
    // check order book
    let takerWeight = 0;
    if (
      (side === "buy" &&
        Number(watchPrice) >
          toDecimalPrice({
            price: Number(lowestAsk.price),
            marketData,
          }).toNumber()) ||
      (side === "sell" &&
        Number(watchPrice) <
          toDecimalPrice({
            price: Number(highestBid.price),
            marketData,
          }).toNumber())
    ) {
      takerWeight = 1;
    }

    if (side === "buy" && Number(watchPrice) > lowestAsk.price) {
      takerWeight = 1;
    }
    const sizeApplyFee = Number(totalSize) * takerWeight;
    return `${(sizeApplyFee * 1) / takerFeeDivisor}`;
  }, [takerFeeDivisor, watchPrice, watchSize]);

  // useEffect(() => {
  //   if (price != null) {
  //     setValue("price", price);
  //   }
  // }, [price, setValue]);

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

  const onSubmit = async ({ price, size }: LimitFormValues) => {
    if (marketData.base == null) {
      throw new Error("Markets without base coin not supported");
    }

    if (
      !balance ||
      balance.quote_available === null ||
      balance.base_available === null
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

    // const rawPrice = toDecimalPrice({
    //   price: toRawCoinAmount(Number(price), marketData.quote.decimals),
    //   marketData,
    // });
    const rawPrice = fromDecimalPrice({
      price: Number(price),
      lotSize: marketData.lot_size,
      tickSize: marketData.tick_size,
      baseCoinDecimals: marketData.base.decimals,
      quoteCoinDecimals: marketData.quote.decimals,
    });

    // const rawPrice = toRawCoinAmount(price, marketData.quote.decimals);

    // validate tick size
    if (!rawPrice.modulo(marketData.tick_size).eq(0)) {
      setError("price", { message: "INVALID TICK SIZE" });
      return;
    }

    const rawBaseBalance = toRawCoinAmount(
      balance.base_available,
      marketData.base.decimals,
    );

    const rawQuoteBalance = toRawCoinAmount(
      balance.quote_available,
      marketData.quote.decimals,
    );

    if (
      (side === "buy" &&
        rawQuoteBalance.lt(
          rawSize
            .times(rawPrice)
            .div(new BigNumber(10).pow(marketData.base.decimals)),
        )) ||
      (side === "sell" && rawBaseBalance.lt(rawSize))
    ) {
      setError("size", { message: "INSUFFICIENT BALANCE" });
      return;
    }

    const orderSideMap: Record<Side, order.Side> = {
      buy: "bid",
      sell: "ask",
    };
    const orderSide = orderSideMap[side];

    const payload = entryFunctions.placeLimitOrderUserEntry(
      ECONIA_ADDR,
      TypeTag.fromApiCoin(marketData.base).toString(),
      TypeTag.fromApiCoin(marketData.quote).toString(),
      BigInt(marketData.market_id), // market id
      "0x1", // TODO get integrator ID
      orderSide,
      BigInt(rawSize.div(marketData.lot_size).toString()),
      BigInt(rawPrice.div(marketData.tick_size).toString()),
      "immediateOrCancel", // TODO don't hardcode
      "abort", // don't hardcode this either
    );
    await signAndSubmitTransaction({
      type: "entry_function_payload",
      ...payload,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mx-4">
        <OrderEntryInputWrapper
          startAdornment="Price"
          endAdornment={marketData.quote.symbol}
          labelFor="price"
          className="mb-4"
        >
          <input
            type="number"
            step="any"
            placeholder="0.00"
            {...register("price", {
              required: "please input price",
              min: {
                value: MIN_PRICE,
                message: "Min price is: " + MIN_PRICE,
              },
              max: {
                value: HI_PRICE,
                message: "Max price is: " + HI_PRICE,
              },
              // TODO: check that amount * size does not exceed quote currency
              // balance for bids
              onChange: (e) => {
                const size = Number(getValues("size"));
                if (!isNaN(size) && !isNaN(e.target.value)) {
                  const totalSize = (size * e.target.value).toFixed(4);
                  setValue("totalSize", totalSize);
                } else {
                  setValue("totalSize", "");
                }
              },
            })}
            className="z-30 w-full bg-transparent pb-3 pl-14 pr-14 pt-3 text-right font-roboto-mono text-xs font-light text-neutral-400 outline-none"
          />
        </OrderEntryInputWrapper>
        <div className="relative">
          <p className="absolute top-[-1rem] text-xs text-red">
            {errors.price != null && errors.price.message}
          </p>
        </div>
      </div>
      <hr className="border-neutral-600" />
      <div className="mx-4 mt-4">
        <OrderEntryInputWrapper
          startAdornment="Amount"
          endAdornment={marketData.base?.symbol}
          labelFor="size"
          className="mb-4"
        >
          <input
            type="number"
            step="any"
            placeholder="0.00"
            {...register("size", {
              required: "please input amount",
              min: 1,
              max: HI_PRICE,
              // TODO: check that size does not exceed base currency balance for asks
              onChange: (e) => {
                const price = Number(getValues("price"));
                if (!isNaN(price) && !isNaN(e.target.value)) {
                  const totalSize = (price * e.target.value).toFixed(4);
                  setValue("totalSize", totalSize);
                } else {
                  setValue("totalSize", "");
                }
              },
            })}
            className="z-30 w-full bg-transparent pb-3 pl-14 pr-14 pt-3 text-right font-roboto-mono text-xs font-light text-neutral-400 outline-none"
          />
        </OrderEntryInputWrapper>
        <div className="relative">
          <p className="absolute top-[-1rem] text-xs text-red">
            {errors.size != null && errors.size.message}
          </p>
        </div>
        <OrderEntryInputWrapper
          startAdornment="Total"
          endAdornment={marketData.quote?.symbol}
        >
          <input
            type="number"
            step="any"
            placeholder="0.00"
            {...register("totalSize", { disabled: true })}
            className="z-30 w-full bg-transparent pb-3 pl-14 pr-14 pt-3 text-right font-roboto-mono text-xs font-light text-neutral-400 outline-none"
          />
        </OrderEntryInputWrapper>
      </div>
      <hr className="my-4 border-neutral-600" />
      <div className="mx-4 mb-4 flex flex-col gap-4">
        <OrderEntryInfo label="EST. FEE" value={estimateFee} />
        <ConnectedButton className="w-full">
          <Button
            type="submit"
            variant={side === "buy" ? "green" : "red"}
            className="w-full text-[16px]/6"
          >
            {side === "buy" ? "Buy" : "Sell"} {marketData.base?.symbol}
          </Button>
        </ConnectedButton>
        <OrderEntryInfo
          label={`${marketData.base?.symbol} AVAILABLE`}
          value={`${balance?.base_available ? balance?.base_available : "--"} ${
            marketData.base?.symbol
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
          value={`${
            balance?.quote_available ? balance.quote_available : "--"
          } ${marketData.quote?.symbol}`}
        />
      </div>
    </form>
  );
};
