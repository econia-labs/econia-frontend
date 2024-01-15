import { type Side } from "./global";

export type ApiCoin = {
  account_address: string;
  module_name: string;
  struct_name: string;
  symbol: string;
  name: string;
  decimals: number;
  logo_url?: string;
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
  order_id: number;
  user: string;
  custodian_id: number;
  self_matching_behavior: number;
  restriction?: number;
  created_at: string;
  last_updated_at: string;
  integrator: string;
  total_filled: number;
  remaining_size: number;
  average_execution_price: number | null;
  order_status: string;
  order_type: string;
  price?: number;
  last_increase_stamp?: number;
  direction: "buy" | "sell" | "bid" | "ask";
};

export type TradeHistory = {
  txn_version: number;
  event_idx: number;
  emit_address: string;
  time: string;
  maker_address: string;
  maker_custodian_id: number;
  maker_order_id: number;
  maker_side: boolean;
  market_id: number;
  price: number;
  sequence_number_for_trade: number;
  size: number;
  taker_address: string;
  taker_custodian_id: number;
  taker_order_id: number;
  taker_quote_fees_paid: number;
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

export type MarketSelectData = {
  name?: string;
  market_id: number;
  registration_time: string;
  base_account_address: string;
  base_module_name: string;
  base_struct_name: string;
  base_name_generic: null | string;
  quote_account_address: string;
  quote_module_name: string;
  quote_struct_name: string;
  lot_size: number;
  tick_size: number;
  min_size: number | null;
  underwriter_id: number;
  is_recognized: boolean;
  last_fill_price_24hr: number | null;
  price_change_as_percent_24hr: number;
  price_change_24hr: number | null;
  min_price_24h: number | null;
  max_price_24h: number | null;
  base_volume_24h: number | null;
  quote_volume_24h: number | null;
  baseAssetIcon?: string;
  quoteAssetIcon?: string;
  base_symbol?: string;
  quote_symbol?: string;
  base_decimals?: number;
  quote_decimals?: number;
  base_name?: string;
  quote_name?: string;
};

export type MarketStats = {
  last_price: number;
  price_change_percentage: number;
  price_change_nominal: number;
  high_price: number;
  low_price: number;
  base_volume: number;
  quote_volume: number;
};

export type ApiPriceLevel = {
  market_id: number;
  side: Side;
  price: number;
  size: number;
  version: number;
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
