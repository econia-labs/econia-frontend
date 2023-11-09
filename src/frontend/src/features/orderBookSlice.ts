import { Orderbook } from "@/types/global";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: Orderbook = {
  bids: [],
  asks: [],
  updatedLevel: undefined,
};

export const orderBookSlice = createSlice({
  name: "orderBook",
  initialState,
  reducers: {
    setOrderBook: (state, action: PayloadAction<Orderbook>) => {
      state = action.payload;
    },
  },
});

export const { setOrderBook } = orderBookSlice.actions;

export default orderBookSlice.reducer;
