import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const usePriceStats = () => {
  const priceStats = useAppSelector((state) => state.priceStats);
  return {
    data: priceStats,
  };
};

export const useOrderBookData = () => {
  const orderBook = useAppSelector((state) => state.orderBook);
  const highestBid = orderBook.bids[orderBook.bids.length - 1];
  const lowestAsk = orderBook.asks[0];
  return {
    orderBook,
    highestBid,
    lowestAsk,
  };
};
