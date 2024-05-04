import { entryFunctions, type order, viewFunctions } from "@econia-labs/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/Button";
import { ConnectedButton } from "@/components/ConnectedButton";
import RangeSlider from "@/components/slider-order/RangeSlider";
import { useAptos } from "@/contexts/AptosContext";
import { ECONIA_ADDR, INTEGRATOR_ADDRESS } from "@/env";
import { usePriceStats } from "@/features/hooks";
import { useBalance } from "@/hooks/useBalance";
import { type ApiMarket } from "@/types/api";
import { type Side } from "@/types/global";
import { toRawCoinAmount } from "@/utils/coin";
import { toDecimalPrice } from "@/utils/econia";
import { TypeTag } from "@/utils/TypeTag";

import { OrderEntryInfo } from "./OrderEntryInfo";
import { OrderEntryInputWrapper } from "./OrderEntryInputWrapper";
type MarketFormValues = {
  size: string;
};

export const MarketOrderEntry: React.FC<{
  marketData: ApiMarket;
  side: Side;
  onDepositWithdrawClick?: () => void;
}> = ({ marketData, side, onDepositWithdrawClick }) => {
  const { signAndSubmitTransaction, aptosClient } = useAptos();
  const [percent, setPercent] = useState(0);
  const {
    handleSubmit,
    register,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<MarketFormValues>();

  const { balance } = useBalance(marketData);

  const watchSize = watch("size", "0.0");
  const {
    data: { last_price },
  } = usePriceStats();

  useEffect(() => {
    const price = toDecimalPrice({
      price: Number(last_price),
      marketData,
    }).toNumber();
    if (side === "buy") {
      if (!balance?.quote_available || !Number(price)) {
        return;
      }
      const maxSize = balance?.quote_available / Number(price);

      setSTotalSize(Number((percent / 100) * maxSize));
    }
    if (side === "sell") {
      if (!balance?.base_available) {
        return;
      }
      setSTotalSize(Number((balance.base_available * percent) / 100));
    }
  }, [percent, balance, side]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setValue("size", `${v}`);
  };

  const { data: takerFeeDivisor } = useQuery(["takerFeeDivisor"], async () => {
    try {
      return await viewFunctions.getTakerFeeDivisor(aptosClient, ECONIA_ADDR);
    } catch (e) {
      return 2000;
    }
  });

  const estimateFee = useMemo(() => {
    const totalSize =
      toDecimalPrice({ price: Number(last_price), marketData }).toNumber() *
      Number(watchSize);
    if (!takerFeeDivisor || !totalSize) {
      return "--";
    }
    const takerSize = Number(totalSize) * 1;
    return `${Number(((takerSize * 1) / takerFeeDivisor).toFixed(4))}`;
  }, [takerFeeDivisor, last_price, watchSize]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const totalSize =
        toDecimalPrice({ price: Number(last_price), marketData }).toNumber() *
        Number(watchSize);
      return totalSize <= Number(balance?.quote_available);
    }

    if (side === "sell") {
      return Number(watchSize) <= Number(balance?.base_available);
    }
  }, [balance, watchSize, last_price]); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (!rawSize.modulo(marketData.lot_size).eq(0)) {
      setError("size", { message: "INVALID LOT SIZE" });
      return;
    }

    if (rawSize.lt(marketData.min_size)) {
      setError("size", { message: "SIZE TOO SMALL" });
      return;
    }

    const rawBaseBalance = toRawCoinAmount(
      balance?.base_available,
      marketData.base.decimals,
    );

    const rawQuoteBalance = toRawCoinAmount(
      balance?.quote_available,
      marketData.quote.decimals,
    );

    if (side === "sell") {
      if (rawBaseBalance.lt(rawSize)) {
        setError("size", { message: "INSUFFICIENT BALANCE" });
        return;
      }
    }

    if (side === "buy") {
      const totalSize = toRawCoinAmount(
        toDecimalPrice({ price: Number(last_price), marketData }).toNumber() *
          Number(size),
        marketData.quote.decimals,
      );
      if (rawQuoteBalance.lt(totalSize)) {
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
      BigInt(marketData.market_id),
      INTEGRATOR_ADDRESS,
      orderSide,
      BigInt(rawSize.div(marketData.lot_size).toString()),
      "abort",
    );

    await signAndSubmitTransaction({ data: payload });
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
              required: "PLEASE INPUT AMOUNT",
              min: 0,
            })}
            className="w-full bg-transparent pb-3 pl-14 pr-14 pt-3 text-right font-roboto-mono text-xs font-light text-neutral-400 outline-none"
          />
        </OrderEntryInputWrapper>
        <div className="relative mb-0">
          <p className="absolute text-xs text-red">
            {errors.size != null && errors.size.message}
          </p>
        </div>
        <RangeSlider
          className="relative left-[50%] mb-0 mt-4 translate-x-[-50%]"
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
      <hr className="my-4 border-neutral-600" />
      <div className="mx-4 mb-4 flex flex-col gap-4">
        <OrderEntryInfo label={`EST. FEE `} value={estimateFee} />
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
              className="w-full whitespace-nowrap py-[10px] uppercase !leading-5 tracking-[0.32px]"
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
            setSTotalSize(
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
