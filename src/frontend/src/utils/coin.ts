import BigNumber from "bignumber.js";

import { type CoinInfo } from "@/hooks/useCoinInfo";

import { getAptosClient } from "./helpers";
import { TypeTag } from "./TypeTag";

/**
 * Converts a given amount in its raw form to its equivalent decimal coin amount.
 *
 * @param {Object} options - An object containing the amount and decimals for the conversion.
 * @param {BigNumber} options.amount - The raw amount to be converted.
 * @param {BigNumber} options.decimals - The number of decimal places used for the coin.
 * @returns {BigNumber} - The converted decimal coin amount.
 *
 * @throws {Error} - If there is an issue with creating or performing operations with the BigNumber.
 *
 * @example
 * Usage example:
 * const rawAmount = new BigNumber('1000000000000000000'); // 1 raw coin unit
 * const decimals = new BigNumber(18);
 * const decimalCoinAmount = toDecimalCoin({ amount: rawAmount, decimals });
 * console.log(decimalCoinAmount.toString()); // Output: '1'
 */
export const toRawCoinAmount = (
  amount: BigNumber.Value,
  decimals: BigNumber.Value,
): BigNumber => {
  return new BigNumber(amount).times(new BigNumber(10).pow(decimals));
};

/**
 * Converts a given amount in its raw form to its equivalent coin amount.
 *
 * @param {BigNumber.Value} amount - The raw amount to be converted.
 * @param {BigNumber.Value} decimals - The number of decimal places used for the coin.
 * @returns {number} - The converted coin amount.
 *
 * @throws {Error} - If there is an issue with creating or performing operations with the BigNumber.
 *
 * @example
 * Usage example:
 * const rawAmount = '1000000000000000000'; // 1 raw coin unit
 * const decimals = 18;
 * const coinAmount = fromRawCoinAmount(rawAmount, decimals);
 * console.log(coinAmount); // Output: 1
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
 * Retrieves coin information for multiple coin types using the Aptos blockchain.
 *
 * @param {TypeTag[]} coinTypes - An array of TypeTag instances representing the coin types.
 * @returns {Promise<{ [key: string]: CoinInfo }>} - A Promise that resolves to an object with coin information, where the keys are coin type strings.
 *
 * @throws {Error} - If there is an issue with fetching the coin information from the blockchain.
 *
 * @example
 * Usage example:
 * const coinTypes = [TypeTag.Default, TypeTag.Custom1, TypeTag.Custom2];
 * try {
 *   const coinInfo = await getCoinInfo(coinTypes);
 *   console.log(coinInfo);
 * } catch (error) {
 *   console.error(error.message || error);
 * }
 */
export async function getCoinInfo(coinTypes: TypeTag[]) {
  const rs: { [key: string]: CoinInfo } = {};
  const aptosClient = getAptosClient();
  const uniqueTypes = [...new Set(coinTypes.map((i) => i.toString()))];

  const t = await Promise.all(
    uniqueTypes.map(async (coinType) => {
      return await aptosClient.getAccountResource<CoinInfo>({
        accountAddress: TypeTag.fromString(coinType).addr,
        resourceType: `0x1::coin::CoinInfo<${coinType.toString()}>`,
      });
    }),
  );
  uniqueTypes.map((type, index) => {
    rs[type.toString()] = t[index];
  });

  return rs;
}
