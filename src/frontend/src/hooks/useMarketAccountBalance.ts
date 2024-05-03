import { AccountAddress, type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";

import { NO_CUSTODIAN } from "@/constants";
import { useAptos } from "@/contexts/AptosContext";
import { ECONIA_ADDR } from "@/env";
import { type ApiCoin } from "@/types/api";
import { type Collateral, type TabListNode } from "@/types/econia";
import { type MoveCoin, type U128 } from "@/types/move";
import { fromRawCoinAmount } from "@/utils/coin";
import { makeMarketAccountId } from "@/utils/econia";
import { TypeTag } from "@/utils/TypeTag";

export const useMarketAccountBalance = (
  addr: AccountAddressInput | undefined | null,
  marketId: number | undefined | null,
  coin: ApiCoin | undefined | null,
) => {
  const { aptosClient } = useAptos();
  return useQuery(
    ["useMarketAccountBalance", addr, marketId, coin],
    async () => {
      if (addr == null || marketId == null || coin == null) return null;
      const selectedCoinTypeTag = TypeTag.fromApiCoin(coin).toString();
      const collateral = await aptosClient.getAccountResource<Collateral>({
        accountAddress: AccountAddress.from(addr),
        resourceType: `${ECONIA_ADDR}::user::Collateral<${selectedCoinTypeTag}>`,
      });
      return await aptosClient
        .getTableItem<TabListNode<U128, MoveCoin>>({
          handle: collateral.map.table.inner.handle,
          data: {
            key_type: "u128",
            value_type: TypeTag.fromTablistNode({
              key: "u128",
              value: `0x1::coin::Coin<${selectedCoinTypeTag}>`,
            }).toString(),
            key: makeMarketAccountId(marketId, NO_CUSTODIAN),
          },
        })
        .then((node: TabListNode<U128, MoveCoin>) => {
          return fromRawCoinAmount(node.value.value, coin.decimals);
        });
    },
  );
};
