import { type PriceLevel } from "@/types/global";

/**
 * Retrieves the language preference of the user.
 *
 * @returns {string} - The language code, such as "en" for English.
 */
export const getLang = () => {
  return typeof window === "undefined"
    ? "en"
    : navigator.language || navigator.languages[0];
};

/**
 * Returns a string representing the sign of a number as either "+" or "" (empty string).
 *
 * @param {number | undefined} num - The number for which the sign is to be determined.
 * @returns {string} - A string representation of the sign. Returns "+" for positive, and an empty string for non-positive numbers or undefined.
 */
export const plusMinus = (num: number | undefined): string => {
  if (!num) return "";
  // no need to return - as numbers will already have that
  return num >= 0 ? `+` : ``;
};

/**
 * Internationalization number formatter for displaying compact price notations.
 *
 * @constant {Intl.NumberFormat} priceFormatter - Number formatter configured for price display.
 */
export const priceFormatter = Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Internationalization number formatter for displaying compact volume notations.
 *
 * @constant {Intl.NumberFormat} volFormatter - Number formatter configured for volume display.
 */
export const volFormatter = Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Formats a number into a string with specified digits and sign display options.
 *
 * @param {number | undefined} num - The number to be formatted. If undefined, returns undefined.
 * @param {number} digits - The number of digits to display after the decimal point.
 * @param {Intl.NumberFormatOptions["signDisplay"]} [signDisplay="never"] - The option for displaying the sign of the number.
 * @returns {undefined | string} - The formatted number as a string or undefined if the input number is undefined.
 */
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

/**
 * Computes the average of two numbers or returns the non-undefined value if only one is defined.
 *
 * @param {number | undefined} price1 - The first price value.
 * @param {number | undefined} price2 - The second price value.
 * @returns {number | undefined} - The average of the two prices or the non-undefined value if only one is defined. Returns undefined if both values are undefined.
 */
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

/**
 * Computes the average price level of two PriceLevel objects or returns the non-undefined value if only one is defined.
 *
 * @param {PriceLevel | undefined} price1 - The first PriceLevel object.
 * @param {PriceLevel | undefined} price2 - The second PriceLevel object.
 * @returns {PriceLevel | undefined} - The average PriceLevel or the non-undefined value if only one is defined. Returns undefined if both values are undefined.
 */
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

/**
 * Calculates the spread between the minimum ask and maximum bid PriceLevel objects or returns the non-undefined value if only one is defined.
 *
 * @param {PriceLevel | undefined} minAsk - The minimum ask PriceLevel object.
 * @param {PriceLevel | undefined} maxBid - The maximum bid PriceLevel object.
 * @returns {PriceLevel | undefined} - The calculated spread PriceLevel or the non-undefined value if only one is defined. Returns undefined if both values are undefined.
 */
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

/**
 * Shortens a string by truncating it to a specified maximum length and appending ".." if needed.
 *
 * @param {string | undefined} str - The string to be shortened. If undefined, returns an empty string.
 * @param {number} [maxLen=10] - The maximum length of the shortened string.
 * @returns {string} - The shortened string or an empty string if the input string is undefined.
 */
export function shorten(str: string | undefined, maxLen = 10) {
  if (str == undefined) return "";
  if (str.length <= maxLen) return str;
  return str.substr(0, maxLen) + "..";
}

/**
 * Formats a number or string by rounding it to a specified number of decimal places.
 *
 * @param {number | string} value - The number or string to be formatted.
 * @param {number} [decimal=2] - The number of decimal places to round to.
 * @returns {string} - The formatted number as a string.
 */
export function formatDecimal(value: number | string, decimal: number = 2) {
  return Number(
    Math.floor(Number(value) * 10 ** decimal) / 10 ** decimal,
  ).toString();
}
