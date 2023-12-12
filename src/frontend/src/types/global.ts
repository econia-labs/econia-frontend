export type Side = "buy" | "sell";
export type Direction = "buy" | "sell";
export type PriceLevel = {
  price: number;
  size: number;
};

export type Orderbook = {
  bids: PriceLevel[];
  asks: PriceLevel[];
  updatedLevel?: PriceLevel;
  isLoading?: boolean;
  focus: {
    side: string;
    price: number;
    totalBase: string | number;
    totalQuote: string | number;
    average: string | number;
  };
};
export type Precision =
  | "0.01"
  | "0.05"
  | "0.1"
  | "0.5"
  | "1"
  | "2.5"
  | "5"
  | "10";
