import { API_URL } from "@/env";
import { type ApiMarket, type MarketSelectData } from "@/types/api";

/**
 * Fetches data for all markets from the specified API endpoint.
 *
 * @returns {Promise<ApiMarket[]>} - A Promise resolving to an array of market data objects.
 *
 * @throws {Error} - Throws an error if the API request fails or encounters an error during processing.
 */
export async function getAllMarket() {
  try {
    const res = await fetch(`${API_URL}/markets`);
    const data = await res.json();
    const allMarketData: ApiMarket[] = data.map((item: MarketSelectData) => {
      return {
        market_id: item.market_id,
        name: `${item.base_symbol}-${item.quote_symbol}`,
        base_name_generic: item.base_name_generic,
        base: {
          account_address: item.base_account_address,
          module_name: item.base_module_name,
          struct_name: item.base_struct_name,
          symbol: item.base_symbol,
          name: item.base_name,
          decimals: item.base_decimals, // Assuming a default value, you may need to adjust this based on your data
        },
        quote: {
          account_address: item.quote_account_address,
          module_name: item.quote_module_name,
          struct_name: item.quote_struct_name,
          symbol: item.quote_symbol,
          name: item.quote_name,
          decimals: item.quote_decimals,
        },
        lot_size: item.lot_size,
        tick_size: item.tick_size,
        min_size: item.min_size,
        underwriter_id: item.underwriter_id,
        created_at: item.registration_time,
        recognized: item.is_recognized, // You may need to adjust this based on your criteria
      };
    });
    return allMarketData;
  } catch (error) {
    console.warn("🚀 ~ file: helpers.ts:117 ~ getAllMarket ~ error:", error);
    throw error;
  }
}

/**
 * Retrieves the client's timezone based on the current system time offset.
 *
 * @returns {Timezone} - The client's timezone as a string identifier (e.g., "America/New_York").
 */
export function getClientTimezone() {
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
      return key;
    }
  }
  return "Etc/UTC";
}
