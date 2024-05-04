import { type Uint64 } from "@aptos-labs/ts-sdk";

import { type Side } from "./order";

export type MakerEventType = "cancel" | "change" | "evict" | "place";

export type MakerEvent = {
  market_id: Uint64;
  side: Side;
  market_order_id: Uint64;
  user_address: string;
  custodian_id?: Uint64;
  event_type: MakerEventType;
  size: Uint64;
  price: Uint64;
  time: Date;
};

export type TakerEvent = {
  market_id: Uint64;
  side: Side;
  market_order_id: Uint64;
  maker: string;
  custodian_id?: Uint64;
  size: Uint64;
  price: Uint64;
  time: Date;
};

export type MarketRegistrationEvent = {
  market_id: Uint64;
  base_account_address?: string;
  base_module_name?: string;
  base_struct_name?: string;
  base_name_generic?: string;
  quote_account_address: string;
  quote_module_name: string;
  quote_struct_name: string;
  lot_size: Uint64;
  tick_size: Uint64;
  min_size: Uint64;
  underwriter_id: Uint64;
  time: Date;
};

export type RecognizedMarketInfo = {
  market_id: Uint64;
  lot_size: Uint64;
  tick_size: Uint64;
  min_size: Uint64;
  underwriter_id: Uint64;
};

export type RecognizedMarketEvent = {
  base_account_address?: string;
  base_module_name?: string;
  base_struct_name?: string;
  base_name_generic?: string;
  quote_account_address: string;
  quote_module_name: string;
  quote_struct_name: string;
  recognized_market_info?: RecognizedMarketInfo;
  time: Date;
};

export type EconiaEvent =
  | MakerEvent
  | TakerEvent
  | MarketRegistrationEvent
  | RecognizedMarketEvent;
