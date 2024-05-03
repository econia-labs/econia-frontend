import { type Uint64 } from "@aptos-labs/ts-sdk";

// Order Side
export type Side = "bid" | "ask";

// Advance Style
export type AdvanceStyle = "ticks" | "percent";

// Self Match Behavior
export type SelfMatchBehavior =
  | "abort"
  | "cancelBoth"
  | "cancelMaker"
  | "cancelTaker";

// Restriction
export type Restriction = "noRestriction" | "fillOrAbort" | "immediateOrCancel";

// Order State
export type OrderState = "open" | "filled" | "cancelled" | "evicted";

// Order
export type Order = {
  market_order_id: Uint64;
  market_id: Uint64;
  side: Side;
  size: Uint64;
  price: Uint64;
  user_address: string;
  custodian_id?: Uint64;
  order_state: OrderState;
  created_at: Date;
};

// Fill
export type Fill = {
  market_id: Uint64;
  maker_order_id: Uint64;
  maker: string;
  maker_side: Side;
  custodian_id?: Uint64;
  size: Uint64;
  price: Uint64;
  time: Date;
};
