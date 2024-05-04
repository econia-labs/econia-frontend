import { entryFunctions, type order, viewFunctions } from "@econia-labs/sdk";
import { useQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/Button";
import { ConnectedButton } from "@/components/ConnectedButton";
import RangeSlider from "@/components/slider-order/RangeSlider";
import { useAptos } from "@/contexts/AptosContext";
import { useOrderEntry } from "@/contexts/OrderEntryContext";
import { ECONIA_ADDR, INTEGRATOR_ADDRESS } from "@/env";
import { useOrderBookData } from "@/features/hooks";
import { useBalance } from "@/hooks/useBalance";
import { type ApiMarket } from "@/types/api";
import { type Side } from "@/types/global";
import { toRawCoinAmount } from "@/utils/coin";
import { fromDecimalPrice, toDecimalPrice } from "@/utils/econia";
import { formatDecimal } from "@/utils/formatter";
import { TypeTag } from "@/utils/TypeTag";

import { OrderEntryInfo } from "./OrderEntryInfo";
import { OrderEntryInputWrapper } from "./OrderEntryInputWrapper";
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
  onDepositWithdrawClick?: () => void;
}> = ({ marketData, side, onDepositWithdrawClick }) => {
  const { signAndSubmitTransaction, aptosClient } = useAptos();
  const {
    handleSubmit,
    register,
    formState,
    getValues,
    setValue,
    setError,
    watch,
  } = useForm<LimitFormValues>({
    defaultValues: {
      price: undefined,
    },
  });

  const { errors } = formState;
  const { data: takerFeeDivisor } = useQuery(["takerFeeDivisor"], async () => {
    try {
      return await viewFunctions.getTakerFeeDivisor(aptosClient, ECONIA_ADDR);
    } catch (e) {
      return 2000;
    }
  });
  const [percent, setPercent] = useState(0);

  const { balance } = useBalance(marketData);
  const watchPrice = watch("price", undefined);

  const watchSize = watch("size");

  const { price } = useOrderEntry();

  useEffect(() => {
    if (price) {
      setValue("price", Number(Number(price).toFixed(3)).toString());
    }
  }, [price, setValue]);

  const { highestBid, lowestAsk } = useOrderBookData(marketData);

  const estimateFee = useMemo(() => {
    let totalSize = Number(watchPrice) * Number(watchSize);
    if (!takerFeeDivisor || !totalSize) {
      return "--";
    }
    if (watchPrice === undefined || !lowestAsk || !highestBid) {
      return "--";
    }

    let takerWeight = 0;
    if (
      side === "buy" &&
      Number(watchPrice) >=
        toDecimalPrice({
          price: Number(lowestAsk.price),
          marketData,
        }).toNumber()
    ) {
      totalSize =
        toDecimalPrice({
          price: Number(lowestAsk.price),
          marketData,
        }).toNumber() * Number(watchSize);
      takerWeight = 1;
    }

    if (
      side === "sell" &&
      Number(watchPrice) <=
        toDecimalPrice({
          price: Number(highestBid.price),
          marketData,
        }).toNumber()
    ) {
      totalSize =
        toDecimalPrice({
          price: Number(highestBid.price),
          marketData,
        }).toNumber() * Number(watchSize);

      takerWeight = 1;
    }

    if (side === "buy" && Number(watchPrice) > lowestAsk.price) {
      takerWeight = 1;
    }
    const sizeApplyFee = Number(totalSize) * takerWeight;
    return `${Number(
      ((sizeApplyFee * 1) / takerFeeDivisor).toFixed(marketData.base.decimals),
    )}`;
  }, [takerFeeDivisor, watchPrice, watchSize]); // eslint-disable-line react-hooks/exhaustive-deps

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
    let rawSize = toRawCoinAmount(size, marketData.base.decimals);
    // check that size satisfies lot sizes
    if (!rawSize.modulo(marketData.lot_size).eq(0)) {
      rawSize = rawSize.minus(rawSize.modulo(marketData.lot_size));
      setTimeout(() => {
        setValue(
          "size",
          `${new BigNumber(rawSize)
            .div(10 ** marketData.base.decimals)
            .toNumber()}`,
        );
      }, 0);
    }

    if (rawSize.lt(marketData.min_size)) {
      setError("size", { message: "SIZE TOO SMALL" });
      return;
    }

    let rawPrice = fromDecimalPrice({
      price: Number(price),
      lotSize: marketData.lot_size,
      tickSize: marketData.tick_size,
      baseCoinDecimals: marketData.base.decimals,
      quoteCoinDecimals: marketData.quote.decimals,
    });

    if (!rawPrice.modulo(marketData.tick_size).eq(0)) {
      rawPrice = rawPrice.minus(rawPrice.modulo(marketData.tick_size));
      setValue("price", `${toDecimalPrice({ price: rawPrice, marketData })}`);
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
            .times(toRawCoinAmount(Number(price), marketData.quote.decimals))
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
      BigInt(marketData.market_id),
      INTEGRATOR_ADDRESS,
      orderSide,
      BigInt(rawSize.div(marketData.lot_size).toString()),
      BigInt(rawPrice.div(marketData.tick_size).toString()),
      "noRestriction",
      "abort",
    );
    await signAndSubmitTransaction({ data: payload });
  };

  const isSufficient = useMemo(() => {
    if (!Number(watchSize)) {
      return true;
    }
    if (
      (side === "buy" && !balance?.quote_available) ||
      (side === "sell" && !balance?.base_available)
    ) {
      return false;
    }
    if (side === "buy") {
      return (
        Number(watchPrice) * Number(watchSize) <=
        Number(balance?.quote_available)
      );
    }

    if (side === "sell") {
      return Number(watchSize) <= Number(balance?.base_available);
    }
  }, [balance, watchSize, watchPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (side === "buy") {
      if (!balance?.quote_available || !Number(watchPrice)) {
        return;
      }
      const maxSize = balance?.quote_available / Number(watchPrice);
      setValue(
        "size",
        formatDecimal(Number((percent / 100) * maxSize), baseDecimalPlace),
      );
    }
    if (side === "sell") {
      if (!balance?.base_available) {
        return;
      }
      setValue(
        "size",
        formatDecimal(
          Number((balance.base_available * percent) / 100),
          baseDecimalPlace,
        ),
      );
    }
  }, [percent, balance, side, watchPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!Number(watchPrice) || !Number(watchSize)) {
      setSTotalSize("");
      return;
    }
    const total = Number(watchSize) * Number(watchPrice);
    setSTotalSize(total);
  }, [watchSize, watchPrice, side]); // eslint-disable-line react-hooks/exhaustive-deps
  const baseDecimalPlace = Math.round(
    Math.log(10 ** marketData.base.decimals / marketData.lot_size) /
      Math.log(10),
  );

  const setSTotalSize = (value: number | string) => {
    const quoteDecimalPlace = Math.round(
      Math.log(
        1 /
          (marketData.tick_size /
            10 ** marketData.quote.decimals /
            (marketData.lot_size / 10 ** marketData.base.decimals)),
      ) / Math.log(10),
    );
    const v = value ? Number(Number(value).toFixed(quoteDecimalPlace)) : value;
    setValue("totalSize", `${v}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="md:mx-4">
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
              required: "PLEASE INPUT PRICE",
              min: {
                value: MIN_PRICE,
                message: "Min price is: " + MIN_PRICE,
              },
              max: {
                value: HI_PRICE,
                message: "Max price is: " + HI_PRICE,
              },
            })}
            className="w-full bg-transparent pb-3 pl-14 pr-14 pt-3 text-right font-roboto-mono text-xs font-light text-neutral-400 outline-none"
          />
        </OrderEntryInputWrapper>
        <div className="relative">
          <p className="absolute top-[-1rem] text-xs text-red">
            {errors.price != null && errors.price.message}
          </p>
        </div>
        <RangeSlider
          className="relative left-[50%] mb-4 mt-4 translate-x-[-50%]"
          style={{
            width: "calc(100% - 7px)",
          }}
          variant={"primary"}
          value={percent}
          onChange={(value) => {
            setPercent(Number(value));
          }}
        />
      </div>
      <hr className="border-neutral-600" />
      <div className="mt-4 md:mx-4">
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
              required: "PLEASE INPUT AMOUNT",
              min: 0,
              onChange: (e) => {
                const price = Number(getValues("price"));
                if (!isNaN(price) && !isNaN(e.target.value)) {
                  const totalSize = (price * e.target.value).toString();
                  setSTotalSize(totalSize);
                } else {
                  setSTotalSize("");
                }
              },
            })}
            className="w-full bg-transparent pb-3 pl-14 pr-14 pt-3 text-right font-roboto-mono text-xs font-light text-neutral-400 outline-none"
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
            className="w-full bg-transparent pb-3 pl-14 pr-14 pt-3 text-right font-roboto-mono text-xs font-light text-neutral-400 outline-none"
          />
        </OrderEntryInputWrapper>
      </div>
      <hr className="my-4 border-neutral-600" />
      <div className="flex flex-col gap-4 md:mx-4 md:mb-4">
        <OrderEntryInfo label={`EST. FEE`} value={estimateFee} />
        <ConnectedButton className="w-full">
          {isSufficient ? (
            <Button
              type="submit"
              variant={side === "buy" ? "green" : "red"}
              className="py-[10px] !leading-5 tracking-[0.32px]"
            >
              {side === "buy" ? "BUY" : "SELL"} {marketData.base?.symbol}
            </Button>
          ) : (
            <Button
              type="submit"
              variant="blue"
              className="whitespace-nowrap py-[10px] uppercase !leading-5 tracking-[0.32px]"
              onClick={(e) => {
                e.preventDefault();
                onDepositWithdrawClick && onDepositWithdrawClick();
              }}
            >
              Add funds to continue
            </Button>
          )}
        </ConnectedButton>
        <OrderEntryInfo
          label={`${marketData.base?.symbol} AVAILABLE`}
          value={`${balance?.base_available ? balance?.base_available : "--"}`}
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
          value={`${balance?.quote_available ? balance.quote_available : "--"}`}
        />
      </div>
    </form>
  );
};
