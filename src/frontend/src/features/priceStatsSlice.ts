import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

import { type MarketStats } from "@/types/api";

const initialState: MarketStats = {
  last_price: 0,
  price_change_percentage: 0,
  price_change_nominal: 0,
  high_price: 0,
  low_price: 0,
  base_volume: 0,
  quote_volume: 0,
};

export const priceStatsSlice = createSlice({
  name: "priceStats",
  initialState,
  reducers: {
    setPriceStats: (state, action: PayloadAction<MarketStats>) => {
      return action.payload;
    },
  },
});

export const { setPriceStats } = priceStatsSlice.actions;

export default priceStatsSlice.reducer;
