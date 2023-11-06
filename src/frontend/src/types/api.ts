import { type Side } from "./global";

export type ApiCoin = {
  account_address: string;
  module_name: string;
  struct_name: string;
  symbol: string;
  name: string;
  decimals: number;
};

export type ApiMarket = {
  market_id: number;
  name: string;
  base: ApiCoin;
  base_name_generic: string | null;
  quote: ApiCoin;
  lot_size: number;
  tick_size: number;
  min_size: number;
  underwriter_id: number;
  created_at: string;
  recognized?: boolean;
};

export type MarketRes = {
  id: number;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: Date;
  atl: number;
  atl_change_percentage: number;
  atl_date: Date;
  roi: null;
  last_updated: Date;
};

export type MarketData = MarketRes & {
  market_id: number;
  base: { symbol: string; name: string; decimals: number } | null;
  base_name_generic: string;
  quote: { symbol: string; name: string; decimals: number };
  lot_size: number;
  tick_size: number;
  min_size: number;
  underwriter_id: number;
};

export type ApiOrder = {
  market_order_id: number;
  market_id: number;
  name: string;
  order_type: string;
  side: "bid" | "ask";
  size: number;
  price: number;
  user_address: string;
  custodian_id: number | null;
  order_status: "open" | "filled" | "cancelled" | "evicted";
  time: string;
};

export type ApiBar = {
  start_time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type ApiResolution =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "12h"
  | "1d";

export type ApiStats = {
  market_id: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  volume: number;
};

export type ApiPriceLevel = {
  market_id: number;
  side: Side;
  price: number;
  size: number;
};

export interface APITickerExchange {
  base: string;
  target: string;
  market: Market;
  last: number;
  volume: number;
  converted_last: { [key: string]: number };
  converted_volume: { [key: string]: number };
  trust_score: string;
  bid_ask_spread_percentage: number;
  timestamp: Date;
  last_traded_at: Date;
  last_fetch_at: Date;
  is_anomaly: boolean;
  is_stale: boolean;
  trade_url: string;
  token_info_url: null;
  coin_id: string;
  target_coin_id?: string;
}

export interface Market {
  name: string;
  identifier: string;
  has_trading_incentive: boolean;
}
