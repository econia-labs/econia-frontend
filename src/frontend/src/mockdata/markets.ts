import { type ApiMarket } from "@/types/api";

export const MOCK_MARKETS: ApiMarket[] = [
  {
    market_id: 3,
    name: "eAPT-eUSDC",
    base: {
      account_address:
        "0xc0de11113b427d35ece1d8991865a941c0578b0f349acabbe9753863c24109ff",
      module_name: "example_apt",
      struct_name: "ExampleAPT",
      symbol: "eAPT",
      name: "ExampleAPT",
      decimals: 8,
    },
    base_name_generic: "",
    quote: {
      account_address:
        "0xc0de11113b427d35ece1d8991865a941c0578b0f349acabbe9753863c24109ff",
      module_name: "example_usdc",
      struct_name: "ExampleUSDC",
      symbol: "eUSDC",
      name: "ExampleUSDC",
      decimals: 6,
    },
    lot_size: 100000,
    tick_size: 1,
    min_size: 500,
    underwriter_id: 0,
    created_at: "2023-05-18T17:22:48.971737Z",
    recognized: true,
  },
  {
    market_id: 2,
    name: "EVGEN-DANI",
    base_name_generic: "",
    base: {
      account_address:
        "0xb3bed2571add05161c6a9a1e1c0d76a62e1d7beef62b6ea5eb58503f1ba283be",
      module_name: "evgen_coin",
      struct_name: "EvgenCoin",
      symbol: "EVGEN",
      name: "EvgenCoin",
      decimals: 6,
    },
    quote: {
      account_address:
        "0x6d8052a72fcf636d7661745ff1ae6d37b7e8cff53db6c285369be5e240d5c014",
      module_name: "danich_coin",
      struct_name: "DanichCoin",
      symbol: "DANI",
      name: "DanichCoin",
      decimals: 6,
    },
    lot_size: 1,
    min_size: 1,
    tick_size: 1,
    underwriter_id: 0,
    created_at: "2023-05-18T17:22:48.971737Z",
    recognized: false,
  },
];
