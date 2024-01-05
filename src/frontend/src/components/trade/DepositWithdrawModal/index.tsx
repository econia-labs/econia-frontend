import { useQuery } from "@tanstack/react-query";

import { API_URL } from "@/env";
import { type MarketSelectData } from "@/types/api";

export const useAllMarketsData = () => {
  return useQuery<MarketSelectData[]>(["marketsData"], async () => {
    const response = await fetch(`${API_URL}/markets`);
    const data = await response.json();
    return data;
  });
};
