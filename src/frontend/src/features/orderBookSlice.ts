import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

import { type Orderbook } from "@/types/global";

const initialState: Orderbook = {
  isLoading: true,
  bids: [],
  asks: [],
  updatedLevel: undefined,
  focus: {
    side: "",
    price: 0,
    totalBase: 0,
    totalQuote: 0,
    average: 0,
  },
};

export const orderBookSlice = createSlice({
  name: "orderBook",
  initialState,
  reducers: {
    setOrderBook: (state, action: PayloadAction<Omit<Orderbook, "focus">>) => {
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };
    },
    setFocus: (state, action: PayloadAction<Orderbook["focus"]>) => {
      return {
        ...state,
        focus: action.payload,
      };
    },
  },
});

export const { setOrderBook, setFocus } = orderBookSlice.actions;

export default orderBookSlice.reducer;
