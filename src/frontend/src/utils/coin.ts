import { AptosClient } from "aptos";
import BigNumber from "bignumber.js";

import { RPC_NODE_URL } from "@/env";
import { type CoinInfo } from "@/hooks/useCoinInfo";

import { TypeTag } from "./TypeTag";

/**
 * Convert an amount of token into the corresponding amount of gas
 *
 * @param amount The amount of token
 * @param decimals The decimal value of token
 * @returns The amount of gas coressponds to the given amout of token and its decimals
 */
export const toRawCoinAmount = (
  amount: BigNumber.Value,
  decimals: BigNumber.Value,
): BigNumber => {
  return new BigNumber(amount).times(new BigNumber(10).pow(decimals));
};

/**
 * Convert an amount of gas into the corresponding amount of token
 *
 * @param amount The amount of gas
 * @param decimals The decimal value of token
 * @returns The amount of token corresponds to the given amount of gas and its decimals
 */
export const fromRawCoinAmount = (
  amount: BigNumber.Value,
  decimals: BigNumber.Value,
) => {
  return new BigNumber(amount)
    .dividedBy(new BigNumber(10).pow(decimals))
    .toNumber();
};

/**
 * Returns the information of a specific list of coin types
 *
 * @param coinTypes The list of coin types to be retrieved
 * @returns The informatoin of all the given coin types
 */
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
