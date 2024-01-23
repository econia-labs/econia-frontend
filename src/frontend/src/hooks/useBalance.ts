import { useQuery } from "@tanstack/react-query";

import { NO_CUSTODIAN } from "@/constants";
import { useAptos } from "@/contexts/AptosContext";
import { API_URL } from "@/env";
import { type ApiMarket } from "@/types/api";

export const useBalance = (marketData: ApiMarket) => {
  const { account } = useAptos();
  const {
    data: balance,
    refetch,
    ...rest
  } = useQuery(
    ["accountBalance", account?.address, marketData.market_id],
    async () => {
      try {
        const response = await fetch(
          `${API_URL}/rpc/user_balance?user_address=${account?.address}&market=${marketData.market_id}&custodian=${NO_CUSTODIAN}`,
        );
        const balance = await response.json();
        if (balance.length) {
          return {
            base_total: balance[0].base_total / 10 ** marketData.base.decimals,
            base_available:
              balance[0].base_available / 10 ** marketData.base.decimals,
            base_ceiling:
              balance[0].base_ceiling / 10 ** marketData.base.decimals,
            quote_total:
              balance[0].quote_total / 10 ** marketData.quote.decimals,
            quote_available:
              balance[0].quote_available / 10 ** marketData.quote.decimals,
            quote_ceiling:
              balance[0].quote_ceiling / 10 ** marketData.quote.decimals,
          };
        }

        return {
          base_total: null,
          base_available: null,
          base_ceiling: null,
          quote_total: null,
          quote_available: null,
          quote_ceiling: null,
        };
      } catch (e) {
        return {
          base_total: null,
          base_available: null,
          base_ceiling: null,
          quote_total: null,
          quote_available: null,
          quote_ceiling: null,
        };
      }
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchInterval: 10 * 1000,
    },
  );

  return {
    balance,
    refetch,
    ...rest,
  };
};
