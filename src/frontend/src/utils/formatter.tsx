import { type PriceLevel } from "@/types/global";

/**
 * Returns the current applying language
 *
 * @returns The language symbol
 */
export const getLang = () => {
  return typeof window === "undefined"
    ? "en"
    : navigator.language || navigator.languages[0];
};

/**
 * Return the notion of a number
 * @param num The input number
 * @returns The corresponding notion symbol of the given number
 */
export const plusMinus = (num: number | undefined): string => {
  if (!num) return "";
  // no need to return - as numbers will already have that
  return num >= 0 ? `+` : ``;
};

/**
 * Format the price value to be displayed correctly
 */
export const priceFormatter = Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Format the volumme value to be displayed correctly
 */
export const volFormatter = Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const formatNumber = (
  num: number | undefined,
  digits: number,
  signDisplay: Intl.NumberFormatOptions["signDisplay"] = "never",
): undefined | string => {
  if (num == undefined) return undefined;
  const lang =
    typeof window === "undefined"
      ? "en"
      : navigator.language || navigator.languages[0];
  return num.toLocaleString(lang, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay,
  });
};

export const averageOrOther = (
  price1: number | undefined,
  price2: number | undefined,
): number | undefined => {
  if (price1 !== undefined && price2 !== undefined) {
    return (price1 + price2) / 2;
  }
  if (price2 == undefined) {
    return price1;
  }
  if (price1 == undefined) {
    return price2;
  }
  // no prices (orderbook empty) maybe should get the last sale price then?
  return 0;
};

export const averageOrOtherPriceLevel = (
  price1: PriceLevel | undefined,
  price2: PriceLevel | undefined,
): PriceLevel | undefined => {
  if (price1 !== undefined && price2 !== undefined) {
    return { price: (price1.price + price2.price) / 2, size: 0 };
  }
  if (price2 == undefined) {
    return price1;
  }
  if (price1 == undefined) {
    return price2;
  }
  // no prices (orderbook empty) maybe should get the last sale price then?
  return { price: 0, size: 0 };
};

export const calculateSpread = (
  minAsk: PriceLevel | undefined,
  maxBid: PriceLevel | undefined,
): PriceLevel | undefined => {
  if (minAsk !== undefined && maxBid !== undefined) {
    return { price: minAsk.price - maxBid.price, size: 0 };
  }
  if (maxBid == undefined) {
    return minAsk;
  }
  if (minAsk == undefined) {
    return maxBid;
  }
  // no prices (orderbook empty) maybe should get the last sale price then?
  return { price: 0, size: 0 };
};

export function shorten(str: string | undefined, maxLen = 10) {
  if (str == undefined) return "";
  if (str.length <= maxLen) return str;
  return str.substr(0, maxLen) + "..";
}

export function formatDecimal(value: number | string, decimal: number = 2) {
  return Number(
    Math.floor(Number(value) * 10 ** decimal) / 10 ** decimal,
  ).toString();
}
