import { toast } from "react-toastify";

import { type MarketData, type MarketRes } from "@/types/api";
import { MOCK_MARKETS } from "@/mockdata/markets";
import { Timezone } from "../../public/static/charting_library";

// Makes requests to Coingecko API
export async function makeApiRequest(path: string) {
  try {
    const response = await fetch(`https://api.coingecko.com/${path}`);
    return response.json();
  } catch (e) {
    if (e instanceof Error) {
      toast.error(e.message);
    } else {
      console.error(e);
    }
  }
}

export async function getAllMarket(currency: string = "usd") {
  return MOCK_MARKETS;
  // const res = await makeApiRequest(
  //   `api/v3/coins/markets?vs_currency=${currency}`,
  // );
  // const allMarketData =
  //   res && res.length > 0
  //     ? (res as MarketRes[]).map(
  //         (item) =>
  //           ({
  //             ...item,
  //             market_id: item.id,
  //             name: `${item.symbol}-usd`.toUpperCase(),
  //             base: {
  //               name: item.name,
  //               symbol: item.symbol,
  //               decimals: 8,
  //             },
  //             quote: {
  //               name: "usd",
  //               symbol: "usd",
  //               decimals: 6,
  //             },
  //             lot_size: 1,
  //             tick_size: 1,
  //             min_size: 1,
  //             underwriter_id: 0,
  //           } as MarketData),
  //       )
  //     : [];
  // return allMarketData;
}

export async function makeApiRequestMin(path: string) {
  try {
    const response = await fetch(`https://min-api.cryptocompare.com/${path}`);
    return response.json();
  } catch (error) {
    throw new Error(`Coingecko request error: ${error}`);
  }
}

// Generates a symbol ID from a pair of the coins
export function generateSymbol(exchange: any, fromSymbol: any, toSymbol: any) {
  const short = `${fromSymbol}-${toSymbol}`;
  return {
    short,
    full: `${exchange}:${short}`,
  };
}

// Returns all parts of the symbol
export function parseFullSymbol(fullSymbol: string) {
  const match = fullSymbol.match(/^(\w+):(\w+)-(\w+)$/);
  if (!match) {
    return null;
  }

  return {
    exchange: match[1],
    fromSymbol: match[2],
    toSymbol: match[3],
  };
}

export function getClientTimezone(): Timezone {
  const timezones: { [key: string]: number } = {};
  timezones["America/New_York"] = -5;
  timezones["America/Los_Angeles"] = -8;
  timezones["America/Chicago"] = -6;
  timezones["America/Phoenix"] = -7;
  timezones["America/Toronto"] = -5;
  timezones["America/Vancouver"] = -8;
  timezones["America/Argentina/Buenos_Aires"] = -3;
  timezones["America/El_Salvador"] = -6;
  timezones["America/Sao_Paulo"] = -3;
  timezones["America/Bogota"] = -5;
  timezones["America/Caracas"] = -4;
  timezones["Europe/Moscow"] = 3;
  timezones["Europe/Athens"] = 2;
  timezones["Europe/Belgrade"] = 1;
  timezones["Europe/Berlin"] = 1;
  timezones["Europe/London"] = 0;
  timezones["Europe/Luxembourg"] = 1;
  timezones["Europe/Madrid"] = 1;
  timezones["Europe/Paris"] = 1;
  timezones["Europe/Rome"] = 1;
  timezones["Europe/Warsaw"] = 1;
  timezones["Europe/Istanbul"] = 3;
  timezones["Europe/Zurich"] = 1;
  timezones["Australia/Sydney"] = 10;
  timezones["Australia/Brisbane"] = 10;
  timezones["Australia/Adelaide"] = 9.5;
  timezones["Australia/ACT"] = 10;
  timezones["Asia/Almaty"] = 6;
  timezones["Asia/Ashkhabad"] = 5;
  timezones["Asia/Tokyo"] = 9;
  timezones["Asia/Taipei"] = 8;
  timezones["Asia/Singapore"] = 8;
  timezones["Asia/Shanghai"] = 8;
  timezones["Asia/Seoul"] = 9;
  timezones["Asia/Tehran"] = 3.5;
  timezones["Asia/Dubai"] = 4;
  timezones["Asia/Kolkata"] = 5.5;
  timezones["Asia/Hong_Kong"] = 8;
  timezones["Asia/Bangkok"] = 7;
  timezones["Asia/Chongqing"] = 8;
  timezones["Asia/Jerusalem"] = 2;
  timezones["Asia/Kuwait"] = 3;
  timezones["Asia/Muscat"] = 4;
  timezones["Asia/Qatar"] = 3;
  timezones["Asia/Riyadh"] = 3;
  timezones["Pacific/Auckland"] = 12;
  timezones["Pacific/Chatham"] = 12.75;
  timezones["Pacific/Fakaofo"] = 13;
  timezones["Pacific/Honolulu"] = -10;
  timezones["America/Mexico_City"] = -6;
  timezones["Africa/Cairo"] = 2;
  timezones["Africa/Johannesburg"] = 2;
  timezones["Asia/Kathmandu"] = 5.75;
  timezones["US/Mountain"] = -7;

  const timezone = (new Date().getTimezoneOffset() * -1) / 60;
  for (const key in timezones) {
    if (timezones[key] === timezone) {
      return key as Timezone;
    }
  }
  return "Etc/UTC";
}
