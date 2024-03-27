import {
  DEFAULT_TESTNET_LIST,
  PERMISSIONED_LIST,
  type RawCoinInfo,
} from "@manahippo/coin-list";

export const NO_CUSTODIAN = 0;

export const TESTNET_TOKEN_LIST: RawCoinInfo[] = [
  ...DEFAULT_TESTNET_LIST.map((coin) => {
    if (coin.symbol === "APT") {
      coin.logo_url = "/tokenImages/APT.png";
    }
    return coin;
  }),
  {
    name: "Test ETH",
    symbol: "tETH",
    official_symbol: "tETH",
    coingecko_id: "",
    decimals: 8,
    logo_url: "/tokenImages/tETH.png",
    project_url: "",
    token_type: {
      type: "0x7c36a610d1cde8853a692c057e7bd2479ba9d5eeaeceafa24f125c23d2abf942::test_eth::TestETHCoin",
      account_address:
        "0x7c36a610d1cde8853a692c057e7bd2479ba9d5eeaeceafa24f125c23d2abf942",
      module_name: "test_eth",
      struct_name: "TestETHCoin",
    },
    extensions: {
      data: [],
    },
    unique_index: DEFAULT_TESTNET_LIST.length + 1,
  },
  {
    name: "Test USDC",
    symbol: "tUSDC",
    official_symbol: "tUSDC",
    coingecko_id: "",
    decimals: 6,
    logo_url: "/tokenImages/tUSDC.png",
    project_url: "",
    token_type: {
      type: "0x7c36a610d1cde8853a692c057e7bd2479ba9d5eeaeceafa24f125c23d2abf942::test_usdc::TestUSDCoin",
      account_address:
        "0x7c36a610d1cde8853a692c057e7bd2479ba9d5eeaeceafa24f125c23d2abf942",
      module_name: "test_usdc",
      struct_name: "TestUSDCoin",
    },
    extensions: {
      data: [],
    },
    unique_index: DEFAULT_TESTNET_LIST.length + 2,
  },
];

export const MAINNET_TOKEN_LIST: RawCoinInfo[] = [
  ...PERMISSIONED_LIST.map((coin) => {
    if (coin.symbol === "APT") {
      coin.logo_url = "/tokenImages/APT.png";
    }
    return coin;
  }),
];

export const MAX_ELEMENTS_PER_FETCH = 100;
export const DEFAULT_PRICE_AXIS_WIDTH = 58;
export const VOLUME_PRICE_CHART_ID = "id_volume";
export const TV_CHARTING_LIBRARY_RESOLUTIONS = [
  "1",
  "5",
  "15",
  "30",
  "60",
  "4H",
  "1D",
];

export const GREEN = "rgba(110, 213, 163, 1.0)";
export const RED = "rgba(240, 129, 129, 1.0)";
export const GREEN_OPACITY_HALF = "rgba(110, 213, 163, 0.5)";
export const RED_OPACITY_HALF = "rgba(240, 129, 129, 0.5)";
