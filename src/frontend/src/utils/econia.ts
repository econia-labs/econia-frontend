import BigNumber from "bignumber.js";

import { type ApiMarket } from "@/types/api";

const TEN = new BigNumber(10);

/**
 * Converts a decimal price to ticks per unit for a given trading pair.
 *
 * @param {Object} options - An object containing the necessary parameters for the conversion.
 * @param {BigNumber.Value | number} options.price - The decimal price to be converted.
 * @param {BigNumber.Value} options.lotSize - The lot size of the trading pair.
 * @param {BigNumber.Value} options.tickSize - The tick size of the trading pair.
 * @param {BigNumber.Value} options.baseCoinDecimals - The number of decimal places for the base coin.
 * @param {BigNumber.Value} options.quoteCoinDecimals - The number of decimal places for the quote coin.
 * @returns {BigNumber} - The converted ticks per unit.
 *
 * @example
 * Usage example:
 * const decimalPrice = 123.456;
 * const lotSize = '100';
 * const tickSize = '0.001';
 * const baseCoinDecimals = 18;
 * const quoteCoinDecimals = 8;
 * const ticksPerUnit = fromDecimalPrice({ price: decimalPrice, lotSize, tickSize, baseCoinDecimals, quoteCoinDecimals });
 * console.log(ticksPerUnit.toString());
 */
export const fromDecimalPrice = ({
  price,
  lotSize,
  tickSize,
  baseCoinDecimals,
  quoteCoinDecimals,
}: {
  price: BigNumber.Value | number;
  lotSize: BigNumber.Value;
  tickSize: BigNumber.Value;
  baseCoinDecimals: BigNumber.Value;
  quoteCoinDecimals: BigNumber.Value;
}): BigNumber => {
  const ticksPerUnit = new BigNumber(price)
    .multipliedBy(TEN.exponentiatedBy(quoteCoinDecimals))
    .div(tickSize);
  const lotsPerUnit = TEN.exponentiatedBy(baseCoinDecimals).div(lotSize);
  return ticksPerUnit.div(lotsPerUnit).decimalPlaces(0, BigNumber.ROUND_UP);
};

/**
 * Converts a price from the given market data into a decimal price.
 *
 * @param {Object} options - An object containing the necessary parameters for the conversion.
 * @param {number | BigNumber} options.price - The price to be converted, either as a number or BigNumber.
 * @param {ApiMarket} options.marketData - The market data containing information about lot size, tick size, and decimals.
 * @returns {BigNumber} - The decimal price calculated based on the provided market data.
 *
 */
export const toDecimalPrice = ({
  price,
  marketData,
}: {
  price: number | BigNumber;
  marketData: ApiMarket;
}) => {
  const bigNumberPrice =
    typeof price === "number" ? new BigNumber(price) : price;
  const lotSize = BigNumber(marketData?.lot_size);
  const tickSize = BigNumber(marketData?.tick_size);
  const baseCoinDecimals = BigNumber(marketData.base?.decimals || 0);
  const quoteCoinDecimals = BigNumber(marketData.quote?.decimals || 0);

  const lotsPerUnit = TEN.exponentiatedBy(baseCoinDecimals).div(lotSize);
  const pricePerLot = bigNumberPrice
    .multipliedBy(tickSize)
    .div(TEN.exponentiatedBy(quoteCoinDecimals));
  return pricePerLot.multipliedBy(lotsPerUnit);
};

/**
 * Converts a size from decimal format to its raw value based on lot size and base coin decimals.
 *
 * @param {Object} options - An object containing the necessary parameters for the conversion.
 * @param {BigNumber.Value} options.size - The size in decimal format to be converted.
 * @param {BigNumber.Value} options.lotSize - The lot size for the given market.
 * @param {BigNumber.Value} options.baseCoinDecimals - The number of decimals for the base coin.
 * @returns {BigNumber} - The raw size value calculated based on the provided parameters.
 */
export const fromDecimalSize = ({
  size,
  lotSize,
  baseCoinDecimals,
}: {
  size: BigNumber.Value;
  lotSize: BigNumber.Value;
  baseCoinDecimals: BigNumber.Value;
}) => {
  return new BigNumber(size)
    .multipliedBy(TEN.exponentiatedBy(baseCoinDecimals))
    .div(lotSize)
    .decimalPlaces(0, BigNumber.ROUND_DOWN);
};

/**
 * Converts a size to decimal format based on lot size and base coin decimals.
 *
 * @param {Object} options - An object containing the necessary parameters for the conversion.
 * @param {number | BigNumber} options.size - The size to be converted, either as a number or BigNumber.
 * @param {ApiMarket} options.marketData - The market data containing information about lot size and base coin decimals.
 * @returns {BigNumber} - The size value in decimal format calculated based on the provided market data.
 */
export const toDecimalSize = ({
  size,
  marketData,
}: {
  size: number | BigNumber;
  marketData: ApiMarket;
}) => {
  const bigNumberSize = typeof size === "number" ? new BigNumber(size) : size;
  const lotSize = BigNumber(marketData?.lot_size);
  const baseCoinDecimals = BigNumber(marketData.base?.decimals || 0);
  return bigNumberSize
    .multipliedBy(lotSize)
    .div(TEN.exponentiatedBy(baseCoinDecimals));
};

/**
 * Converts ticks to decimal format based on tick size and quote coin decimals.
 *
 * @param {Object} options - An object containing the necessary parameters for the conversion.
 * @param {BigNumber} options.ticks - The ticks to be converted.
 * @param {BigNumber} options.tickSize - The tick size for the given market.
 * @param {BigNumber} options.quoteCoinDecimals - The number of decimals for the quote coin.
 * @returns {BigNumber} - The ticks value in decimal format calculated based on the provided parameters.
 */
export const toDecimalQuote = ({
  ticks,
  tickSize,
  quoteCoinDecimals,
}: {
  ticks: BigNumber;
  tickSize: BigNumber;
  quoteCoinDecimals: BigNumber;
}) => {
  return ticks
    .multipliedBy(tickSize)
    .div(TEN.exponentiatedBy(quoteCoinDecimals));
};

/**
 * Converts a quote in decimal format to its raw value based on tick size and quote coin decimals.
 *
 * @param {Object} options - An object containing the necessary parameters for the conversion.
 * @param {BigNumber} options.quote - The quote in decimal format to be converted.
 * @param {BigNumber} options.tickSize - The tick size for the given market.
 * @param {BigNumber} options.quoteCoinDecimals - The number of decimals for the quote coin.
 * @returns {BigNumber} - The raw quote value calculated based on the provided parameters.
 */
export const fromDecimalQuote = ({
  quote,
  tickSize,
  quoteCoinDecimals,
}: {
  quote: BigNumber;
  tickSize: BigNumber;
  quoteCoinDecimals: BigNumber;
}) => {
  return new BigNumber(
    Math.floor(
      quote
        .multipliedBy(TEN.exponentiatedBy(quoteCoinDecimals))
        .div(tickSize)
        .toNumber(),
    ),
  );
};

/**
 * Converts a coin amount to decimal format based on the specified number of decimals.
 *
 * @param {Object} options - An object containing the necessary parameters for the conversion.
 * @param {BigNumber} options.amount - The coin amount to be converted.
 * @param {BigNumber} options.decimals - The number of decimals for the coin.
 * @returns {BigNumber} - The coin amount in decimal format calculated based on the provided parameters.
 */
export const toDecimalCoin = ({
  amount,
  decimals,
}: {
  amount: BigNumber;
  decimals: BigNumber;
}) => {
  return amount.div(TEN.exponentiatedBy(decimals));
};

/**
 * Converts a coin amount in decimal format to its raw value based on the specified number of decimals.
 *
 * @param {Object} options - An object containing the necessary parameters for the conversion.
 * @param {BigNumber} options.amount - The coin amount in decimal format to be converted.
 * @param {BigNumber} options.decimals - The number of decimals for the coin.
 * @returns {BigNumber} - The raw coin amount value calculated based on the provided parameters.
 */
export const fromDecimalCoin = ({
  amount,
  decimals,
}: {
  amount: BigNumber;
  decimals: BigNumber;
}) => {
  return amount.multipliedBy(TEN.exponentiatedBy(decimals));
};

/**
 * Generates a market account ID by combining market ID and custodian ID.
 *
 * @param {number} marketId - The unique identifier for the market.
 * @param {number} custodianId - The unique identifier for the custodian.
 * @returns {string} - The market account ID.
 */
export const makeMarketAccountId = (marketId: number, custodianId: number) => {
  const marketIdHex = BigInt(marketId).toString(16).padStart(16, "0");
  const custodianIdHex = BigInt(custodianId).toString(16).padStart(16, "0");
  return BigInt(`0x${marketIdHex}${custodianIdHex}`).toString();
};
