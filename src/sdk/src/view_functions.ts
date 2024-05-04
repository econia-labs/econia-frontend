import {
  AccountAddress,
  AccountAddressInput,
  Aptos,
  Uint128,
} from "@aptos-labs/ts-sdk";

export const getTakerFeeDivisor = async (
  aptos: Aptos,
  econiaAddress: AccountAddressInput,
): Promise<number> => {
  const addr = AccountAddress.from(econiaAddress);
  const res = await aptos.view({
    payload: {
      function: `${addr.toString()}::incentives::get_taker_fee_divisor`,
    },
  });
  return Number(res[0]);
};

export const hasMarketAccountByMarketId = async (
  aptos: Aptos,
  econiaAddress: AccountAddressInput,
  userAddress: AccountAddressInput,
  marketId: Uint128,
): Promise<boolean> => {
  const addr = AccountAddress.from(econiaAddress);
  const userAddr = AccountAddress.from(userAddress);
  const res = await aptos.view({
    payload: {
      function: `${addr.toString()}::user::has_market_account_by_market_id`,
      functionArguments: [userAddr, marketId].map(a => a.toString()),
    },
  });
  return res[0] as boolean;
};
