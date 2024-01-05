import { RPC_NODE_URL } from "@/env";
import { AptosClient, TypeTagParser } from "aptos";
import BigNumber from "bignumber.js";
import { TypeTag } from "./TypeTag";
import { MoveResource } from "aptos/src/generated";
import { CoinInfo } from "@/hooks/useCoinInfo";

export const toRawCoinAmount = (
  amount: BigNumber.Value,
  decimals: BigNumber.Value,
): BigNumber => {
  return new BigNumber(amount).times(new BigNumber(10).pow(decimals));
};

export const fromRawCoinAmount = (
  amount: BigNumber.Value,
  decimals: BigNumber.Value,
) => {
  return new BigNumber(amount)
    .dividedBy(new BigNumber(10).pow(decimals))
    .toNumber();
};

export async function getCoinInfo(coinTypes: TypeTag[]) {
  const rs: { [key: string]: CoinInfo } = {};
  const aptosClient = new AptosClient(RPC_NODE_URL);
  const uniqueTypes = [...new Set(coinTypes.map((i) => i.toString()))];

  const t = await Promise.all(
    uniqueTypes.map(async (coinType) => {
      return await aptosClient.getAccountResource(
        TypeTag.fromString(coinType).addr,
        `0x1::coin::CoinInfo<${coinType.toString()}>`,
      );
    }),
  );
  uniqueTypes.map((type, index) => {
    rs[type.toString()] = t[index].data as CoinInfo;
  });

  return rs;
}
