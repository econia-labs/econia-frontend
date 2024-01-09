import BigNumber from "bignumber.js";

import { type ApiMarket } from "@/types/api";

const TEN = new BigNumber(10);

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
}) => {
  const ticksPerUnit = new BigNumber(price)
    .multipliedBy(TEN.exponentiatedBy(quoteCoinDecimals))
    .div(tickSize);
  const lotsPerUnit = TEN.exponentiatedBy(baseCoinDecimals).div(lotSize);
  return ticksPerUnit.div(lotsPerUnit).decimalPlaces(0, BigNumber.ROUND_UP);
};

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

export const toDecimalCoin = ({
  amount,
  decimals,
}: {
  amount: BigNumber;
  decimals: BigNumber;
}) => {
  return amount.div(TEN.exponentiatedBy(decimals));
};

export const fromDecimalCoin = ({
  amount,
  decimals,
}: {
  amount: BigNumber;
  decimals: BigNumber;
}) => {
  return amount.multipliedBy(TEN.exponentiatedBy(decimals));
};

export const makeMarketAccountId = (marketId: number, custodianId: number) => {
  const marketIdHex = BigInt(marketId).toString(16).padStart(16, "0");
  const custodianIdHex = BigInt(custodianId).toString(16).padStart(16, "0");
  return BigInt(`0x${marketIdHex}${custodianIdHex}`).toString();
};
