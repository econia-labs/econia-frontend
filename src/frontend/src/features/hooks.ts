import type { TypedUseSelectorHook } from "react-redux";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/store/store";
import { type ApiMarket } from "@/types/api";
import { type PriceLevel } from "@/types/global";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";

import { setFocus } from "./orderBookSlice";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const usePriceStats = () => {
  const priceStats = useAppSelector((state) => state.priceStats);
  return {
    data: priceStats,
  };
};

export const useOrderBookData = (marketData: ApiMarket) => {
  const orderBook = useAppSelector((state) => state.orderBook);
  const highestBid = orderBook.bids[0];
  const lowestAsk = orderBook.asks[0];

  const dispatch = useDispatch();
  const sumBaseF = (side: "ask" | "bid", price: number) => {
    if (side === "ask") {
      return (a: number, b: PriceLevel) => {
        const p = toDecimalPrice({
          price: b.price,
          marketData,
        }).toNumber();
        const size = toDecimalSize({
          size: b.size,
          marketData: marketData,
        }).toNumber();
        return p <= price ? size + a : a;
      };
    }
    return (a: number, b: PriceLevel) => {
      const p = toDecimalPrice({
        price: b.price,
        marketData,
      }).toNumber();
      const size = toDecimalSize({
        size: b.size,
        marketData: marketData,
      }).toNumber();

      return p >= price ? size + a : a;
    };
  };

  const sumQuoteF = (side: "ask" | "bid", price: number) => {
    if (side === "ask") {
      return (a: number, b: PriceLevel) => {
        const p = toDecimalPrice({
          price: b.price,
          marketData,
        }).toNumber();

        const size = toDecimalSize({
          size: b.size,
          marketData: marketData,
        }).toNumber();

        return p <= price ? size * p + a : a;
      };
    }
    return (a: number, b: PriceLevel) => {
      const p = toDecimalPrice({
        price: b.price,
        marketData,
      }).toNumber();
      const size = toDecimalSize({
        size: b.size,
        marketData: marketData,
      }).toNumber();

      return p >= price ? size * p + a : a;
    };
  };
  const _setFocus = (data: { side: "ask" | "bid" | ""; price: number }) => {
    if (
      data.price != orderBook.focus.price ||
      data.side != orderBook.focus.side
    ) {
      const totalBase =
        data.side === "ask"
          ? orderBook.asks.reduce(sumBaseF("ask", data.price), 0)
          : orderBook.bids.reduce(sumBaseF("bid", data.price), 0);
      const totalQuote =
        data.side === "ask"
          ? orderBook.asks.reduce(sumQuoteF("ask", data.price), 0)
          : orderBook.bids.reduce(sumQuoteF("bid", data.price), 0);
      dispatch(
        setFocus({
          ...data,
          totalBase: Number(totalBase.toFixed(4)),
          totalQuote: Number(Number(totalQuote).toFixed(4)),
          average: Number(
            Number(totalBase ? totalQuote / totalBase : 0).toFixed(4),
          ),
        }),
      );
    }
  };
  return {
    orderBook,
    highestBid,
    lowestAsk,
    focus: orderBook.focus,
    setFocus: _setFocus,
  };
};
