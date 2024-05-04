import { AccountAddress, type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";

import { useAptos } from "@/contexts/AptosContext";
import { fromRawCoinAmount } from "@/utils/coin";
import { type TypeTag } from "@/utils/TypeTag";

import { useCoinInfo } from "./useCoinInfo";

export type CoinStore = {
  coin: {
    value: number;
  };
};

export const CoinBalanceQueryKey = (
  coinTypeTag?: TypeTag | null,
  userAddr?: AccountAddressInput | null,
) => [
  "useCoinBalance",
  coinTypeTag?.toString(),
  userAddr ? AccountAddress.from(userAddr) : null,
];

export const useCoinBalance = (
  coinTypeTag?: TypeTag | null,
  userAddrInput?: AccountAddressInput | null,
) => {
  const { aptosClient } = useAptos();
  const coinInfo = useCoinInfo(coinTypeTag);
  const userAddr = userAddrInput ? AccountAddress.from(userAddrInput) : null;
  return useQuery(
    CoinBalanceQueryKey(coinTypeTag, userAddr),
    async () => {
      if (!userAddr || !coinTypeTag) return null;
      const coinStore = await aptosClient.getAccountResource<CoinStore>({
        accountAddress: userAddr,
        resourceType: `0x1::coin::CoinStore<${coinTypeTag.toString()}>`,
      });
      return fromRawCoinAmount(coinStore.coin.value, coinInfo.data!.decimals);
    },
    {
      enabled: !!coinInfo.data,
    },
  );
};
