import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { API_URL } from "@/env";
import { type Orderbook, type Precision } from "@/types/global";

// TODO: precision not yet implemented in API yet, so does nothing as of now
// TODO update to include precision when backend is updated (ECO-199)

export const useOrderBook = (
  market_id: number,
  precision: Precision = "0.01",
  depth = 60,
): UseQueryResult<Orderbook> => {
  return useQuery(
    ["orderBook", market_id, precision],
    async () => {
      const fetchPromises = [
        fetch(
          `${API_URL}/price_levels?market_id=eq.${market_id}&side=eq.bid&limit=${depth}`,
        ),
        fetch(
          `${API_URL}/price_levels?market_id=eq.${market_id}&side=eq.ask&limit=${depth}`,
        ),
      ];
      const [response1, response2] = await Promise.all(fetchPromises);
      const bids = await response1.json();
      const asks = await response2.json();
      // change value total_size to size to match the rest of the app
      bids.forEach((bid: any) => {
        bid.size = bid.total_size;
        delete bid.total_size;
      });
      asks.forEach((ask: any) => {
        ask.size = ask.total_size;
        delete ask.total_size;
      });
      const orderBookData = { bids, asks };
      return orderBookData as Orderbook;
    },
    { keepPreviousData: true, refetchOnWindowFocus: false },
  );
};
