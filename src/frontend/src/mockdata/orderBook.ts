import { type Orderbook } from "@/types/global";

export const mockOrderbook: Orderbook = {
  bids: [
    { price: 100.5, size: 10 },
    { price: 100.4, size: 5 },
    { price: 100.3, size: 15 },
    { price: 100.2, size: 8 },
    { price: 100.1, size: 12 },
    { price: 100.0, size: 3 },
    { price: 99.9, size: 6 },
    { price: 99.8, size: 7 },
    { price: 99.7, size: 11 },
    { price: 99.6, size: 4 },
    { price: 99.5, size: 9 },
    { price: 99.4, size: 2 },
  ],
  asks: [
    { price: 101.0, size: 8 },
    { price: 101.2, size: 12 },
    { price: 101.5, size: 20 },
    { price: 101.7, size: 7 },
    { price: 101.9, size: 10 },
    { price: 102.0, size: 15 },
    { price: 102.1, size: 5 },
    { price: 102.3, size: 18 },
    { price: 102.5, size: 14 },
    { price: 102.7, size: 9 },
    { price: 102.8, size: 13 },
    { price: 103.0, size: 6 },
  ],
  updatedLevel: { price: 100.6, size: 7 },
};
