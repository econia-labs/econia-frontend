import { toast } from "react-toastify";

import { ApiMarket, type MarketData, type MarketRes } from "@/types/api";
// import { MOCK_MARKETS } from "@/mockdata/markets";
import { Timezone } from "../../public/static/charting_library";
import { API_URL } from "@/env";
import { getTokenInfo } from "./hippo-coin";
import { getCoinInfo } from "./coin";
import { TypeTag } from "./TypeTag";

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

export async function getAllMarket() {
  try {
    const res = await fetch(`${API_URL}/market_registration_events`);
    const data = await res.json();
    const allMarketData: ApiMarket[] = data.map((item: any) => {
      const [preBase, postBase] = item.base_module_name.split("_");
      const baseSymbol = postBase
        ? `${preBase.slice(0, 1).toLowerCase()}${postBase.toUpperCase()}`
        : preBase;
      const [preQuote, postQuote] = item.quote_module_name.split("_");
      const quoteSymbol = postQuote
        ? `${preQuote.slice(0, 1).toLowerCase()}${postQuote.toUpperCase()}`
        : preQuote;

      return {
        market_id: item.market_id,
        name: `${baseSymbol}-${quoteSymbol}`,
        base_name_generic: item.base_name_generic,
        base: {
          account_address: item.base_account_address,
          module_name: item.base_module_name,
          struct_name: item.base_struct_name,
          symbol: baseSymbol,
          name: item.base_name_generic || item.base_struct_name,
          decimals: 8, // Assuming a default value, you may need to adjust this based on your data
        },
        quote: {
          account_address: item.quote_account_address,
          module_name: item.quote_module_name,
          struct_name: item.quote_struct_name,
          symbol: quoteSymbol,
          name: item.quote_struct_name,
          decimals: 6, // Assuming a default value, you may need to adjust this based on your data
        },
        lot_size: item.lot_size,
        tick_size: item.tick_size,
        min_size: item.min_size,
        underwriter_id: item.underwriter_id,
        created_at: item.time,
        recognized: true, // You may need to adjust this based on your criteria
      };
    });
    // .map((m: ApiMarket) => {
    //   const baseTokenInfo = getTokenInfo(
    //     `${m.base.account_address}::${m.base.module_name}::${m.base.struct_name}`,
    //   );
    //   if (baseTokenInfo) {
    //     m.base.decimals = baseTokenInfo.decimals;
    //     m.base.symbol = baseTokenInfo.symbol;
    //     m.base.name = baseTokenInfo.name;
    //     m.base.logo_url = baseTokenInfo.logo_url;
    //   }

    //   const quoteTokenInfo = getTokenInfo(
    //     `${m.quote.account_address}::${m.quote.module_name}::${m.quote.struct_name}`,
    //   );
    //   if (quoteTokenInfo) {
    //     m.quote.decimals = quoteTokenInfo.decimals;
    //     m.quote.symbol = quoteTokenInfo.symbol;
    //     m.quote.name = quoteTokenInfo.name;
    //     m.quote.logo_url = quoteTokenInfo.logo_url;
    //   }
    //   if (quoteTokenInfo && baseTokenInfo) {
    //     m.name = `${baseTokenInfo.symbol}-${quoteTokenInfo.symbol}`;
    //   }
    //   return m;
    // });
    const coinInfo = await getCoinInfo(
      allMarketData.reduce((a, b) => {
        return [
          ...a,
          TypeTag.fromApiCoin(b.base),
          TypeTag.fromApiCoin(b.quote),
        ];
      }, [] as TypeTag[]),
    );

    return allMarketData.map((market) => {
      const baseType = TypeTag.fromApiCoin(market.base);
      const quoteType = TypeTag.fromApiCoin(market.quote);
      if (coinInfo[baseType.toString()]) {
        market.base.decimals = coinInfo[baseType.toString()].decimals;
        market.base.name = coinInfo[baseType.toString()].name;
        market.base.symbol = coinInfo[baseType.toString()].symbol;
      }
      if (coinInfo[quoteType.toString()]) {
        market.quote.decimals = coinInfo[quoteType.toString()].decimals;
        market.quote.name = coinInfo[quoteType.toString()].name;
        market.quote.symbol = coinInfo[quoteType.toString()].symbol;
      }
      return market;
    });
  } catch (error) {
    console.log("🚀 ~ file: helpers.ts:70 ~ getAllMarket ~ error:", error);
    throw error;
  }
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
