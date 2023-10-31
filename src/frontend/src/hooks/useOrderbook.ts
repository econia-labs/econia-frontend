import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { API_URL } from "@/env";
import { type Orderbook, type Precision } from "@/types/global";
import { mockOrderbook } from "@/mockdata/orderBook";
// TODO: precision not yet implemented in API yet, so does nothing as of now
export const useOrderBook = (
  market_id: number,
  precision: Precision = "0.01",
  depth = 60,
): UseQueryResult<Orderbook> => {
  return useQuery(
    ["orderBook", market_id, precision],
    async () => {
      // const response = await fetch(
      //   // `${API_URL}/markets/${market_id}/orderbook?depth=${depth}`,
      //   `${API_URL}/limit_orders?order_status=eq.open&order=last_increase_stamp.asc&market_id=eq.${market_id}`
      // );
      // const data = await response.json();
      // return data as Orderbook;

      return mockOrderbook
    },
    { keepPreviousData: true, refetchOnWindowFocus: false },
  );
};
