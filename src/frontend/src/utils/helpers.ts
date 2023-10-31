import { toast } from "react-toastify";

import { type MarketData, type MarketRes } from "@/types/api";

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
  const res = await makeApiRequest(
    `api/v3/coins/markets?vs_currency=${currency}`,
  );
  const allMarketData =
    res && res.length > 0
      ? (res as MarketRes[]).map(
          (item) =>
            ({
              ...item,
              market_id: item.id,
              name: `${item.symbol}-usd`.toUpperCase(),
              base: {
                name: item.name,
                symbol: item.symbol,
                decimals: 8,
              },
              quote: {
                name: "usd",
                symbol: "usd",
                decimals: 6,
              },
              lot_size: 1,
              tick_size: 1,
              min_size: 1,
              underwriter_id: 0,
            } as MarketData),
        )
      : [];
  return allMarketData;
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
