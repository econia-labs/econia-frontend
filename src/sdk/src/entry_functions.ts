import {
  type AccountAddressInput,
  type InputEntryFunctionData,
  type TypeTag,
  type Uint8,
  type Uint64,
  type Uint128,
} from "@aptos-labs/ts-sdk";

import {
  type AdvanceStyle,
  type Restriction,
  type SelfMatchBehavior,
  type Side,
} from "./order";
import {
  advanceStyleToNumber,
  restrictionToNumber,
  selfMatchBehaviorToNumber,
  sideToBoolean,
  sideToNumber,
} from "./utils";

// Incentives entry functions

export const updateIncentives = (
  econiaAddress: AccountAddressInput,
  utilityCoin: string | TypeTag,
  marketRegistrationFee: Uint64,
  underwriterRegistrationFee: Uint64,
  custodianRegistrationFee: Uint64,
  takerFeeDivisor: Uint64,
  integratorFeeStoreTiers: Uint64[][]
): InputEntryFunctionData => ({
  function: `${econiaAddress}::incentives::update_incentives`,
  typeArguments: [utilityCoin],
  functionArguments: [
    marketRegistrationFee,
    underwriterRegistrationFee,
    custodianRegistrationFee,
    takerFeeDivisor,
    integratorFeeStoreTiers,
  ],
});

export const upgradeIntegratorFeeStoreViaCoinstore = (
  econiaAddress: AccountAddressInput,
  quoteCoin: string | TypeTag,
  utilityCoin: string | TypeTag,
  marketId: Uint64,
  newTier: Uint8
): InputEntryFunctionData => ({
  function: `${econiaAddress}::incentives::upgrade_integrator_fee_store_via_coinstore`,
  typeArguments: [quoteCoin, utilityCoin],
  functionArguments: [marketId, newTier],
});

export const withdrawIntegratorFeesViaCoinstores = (
  econiaAddress: AccountAddressInput,
  quoteCoin: string | TypeTag,
  utilityCoin: string | TypeTag,
  marketId: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::incentives::withdraw_integrator_fees_via_coinstores`,
  typeArguments: [quoteCoin, utilityCoin],
  functionArguments: [marketId],
});

// market entry functions

export const cancelAllOrdersUser = (
  econiaAddress: AccountAddressInput,
  marketId: Uint64,
  side: Side
): InputEntryFunctionData => ({
  function: `${econiaAddress}::market::cancel_all_orders_user`,
  functionArguments: [marketId, sideToNumber(side)],
});

export const cancelOrderUser = (
  econiaAddress: AccountAddressInput,
  marketId: Uint64,
  side: Side,
  marketOrderId: Uint128
): InputEntryFunctionData => ({
  function: `${econiaAddress}::market::cancel_order_user`,
  functionArguments: [marketId, sideToBoolean(side), marketOrderId],
});

export const changeOrderSizeUser = (
  econiaAddress: AccountAddressInput,
  marketId: Uint64,
  side: Side,
  marketOrderId: Uint128,
  newSize: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::market::change_order_size_user`,
  functionArguments: [marketId, sideToNumber(side), marketOrderId, newSize],
});

export const placeLimitOrderPassiveAdvanceUserEntry = (
  econiaAddress: AccountAddressInput,
  base: string | TypeTag,
  quote: string | TypeTag,
  marketId: Uint64,
  integrator: AccountAddressInput,
  side: Side,
  size: Uint64,
  advanceStyle: AdvanceStyle,
  targetAdvanceAmount: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::market::place_limit_order_passive_advance_user_entry`,
  typeArguments: [base, quote],
  functionArguments: [
    marketId,
    integrator,
    sideToNumber(side),
    size,
    advanceStyleToNumber(advanceStyle),
    targetAdvanceAmount,
  ],
});

export const placeLimitOrderUserEntry = (
  econiaAddress: AccountAddressInput,
  base: string | TypeTag,
  quote: string | TypeTag,
  marketId: Uint64,
  integrator: AccountAddressInput,
  side: Side,
  size: Uint64,
  price: Uint64,
  restriction: Restriction,
  selfMatchBehavior: SelfMatchBehavior
): InputEntryFunctionData => ({
  function: `${econiaAddress}::market::place_limit_order_user_entry`,
  typeArguments: [base, quote],
  functionArguments: [
    marketId,
    integrator,
    sideToBoolean(side),
    size,
    price,
    restrictionToNumber(restriction),
    selfMatchBehaviorToNumber(selfMatchBehavior),
  ],
});

export const placeMarketOrderUserEntry = (
  econiaAddress: AccountAddressInput,
  base: string | TypeTag,
  quote: string | TypeTag,
  marketId: Uint64,
  integrator: AccountAddressInput,
  side: Side,
  size: Uint64,
  selfMatchBehavior: SelfMatchBehavior
): InputEntryFunctionData => ({
  function: `${econiaAddress}::market::place_market_order_user_entry`,
  typeArguments: [base, quote],
  functionArguments: [
    marketId,
    integrator,
    sideToBoolean(side),
    size,
    selfMatchBehaviorToNumber(selfMatchBehavior),
  ],
});

export const registerMarketBaseCoinFromCoinstore = (
  econiaAddress: AccountAddressInput,
  base: string | TypeTag,
  quote: string | TypeTag,
  utilityCoin: string | TypeTag,
  lotSize: Uint64,
  tickSize: Uint64,
  minSize: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::market::register_market_base_coin_from_coinstore`,
  typeArguments: [base, quote, utilityCoin],
  functionArguments: [lotSize, tickSize, minSize],
});

export const swapBetweenCoinstoresEntry = (
  econiaAddress: AccountAddressInput,
  base: string | TypeTag,
  quote: string | TypeTag,
  marketId: Uint64,
  integrator: AccountAddressInput,
  side: Side,
  minBase: Uint64,
  maxBase: Uint64,
  minQuote: Uint64,
  maxQuote: Uint64,
  limitPrice: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::market::swap_between_coinstores_entry`,
  typeArguments: [base, quote],
  functionArguments: [
    marketId,
    integrator,
    sideToBoolean(side),
    minBase,
    maxBase,
    minQuote,
    maxQuote,
    limitPrice,
  ],
});

// registry functions

export const registerIntegratorFeeStoreBaseTier = (
  econiaAddress: AccountAddressInput,
  quote: string | TypeTag,
  utilityCoin: string | TypeTag,
  marketId: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::registry::register_integrator_fee_store_base_tier`,
  typeArguments: [quote, utilityCoin],
  functionArguments: [marketId],
});

export const registerIntegratorFeeStoreFromCoinstore = (
  econiaAddress: AccountAddressInput,
  quote: string | TypeTag,
  utilityCoin: string | TypeTag,
  marketId: Uint64,
  tier: Uint8
): InputEntryFunctionData => ({
  function: `${econiaAddress}::registry::register_integrator_fee_store_from_coinstore`,
  typeArguments: [quote, utilityCoin],
  functionArguments: [marketId, tier],
});

export const removeRecognizedMarkets = (
  econiaAddress: AccountAddressInput,
  marketIds: Uint64[]
): InputEntryFunctionData => ({
  function: `${econiaAddress}::registry::remove_recognized_markets`,
  functionArguments: [marketIds],
});

export const setRecognizedMarket = (
  econiaAddress: AccountAddressInput,
  marketId: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::registry::set_recognized_market`,
  functionArguments: [marketId],
});

export const depositFromCoinstore = (
  econiaAddress: AccountAddressInput,
  coin: string | TypeTag,
  marketId: Uint64,
  custodianId: Uint64,
  amount: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::user::deposit_from_coinstore`,
  typeArguments: [coin],
  functionArguments: [marketId, custodianId, amount],
});

export const registerMarketAccount = (
  econiaAddress: AccountAddressInput,
  base: string | TypeTag,
  quote: string | TypeTag,
  marketId: Uint64,
  custodianId: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::user::register_market_account`,
  typeArguments: [base, quote],
  functionArguments: [marketId, custodianId],
});

export const registerMarketAccountGenericBase = (
  econiaAddress: AccountAddressInput,
  quote: string | TypeTag,
  marketId: Uint64,
  custodianId: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::user::register_market_account_generic_base`,
  typeArguments: [quote],
  functionArguments: [marketId, custodianId],
});

export const withdrawToCoinstore = (
  econiaAddress: AccountAddressInput,
  coin: string | TypeTag,
  marketId: Uint64,
  amount: Uint64
): InputEntryFunctionData => ({
  function: `${econiaAddress}::user::withdraw_to_coinstore`,
  typeArguments: [coin],
  functionArguments: [marketId, amount],
});

export const faucetMint = (
  faucetAddress: AccountAddressInput,
  coin: string | TypeTag,
  amount: Uint64
): InputEntryFunctionData => ({
  function: `${faucetAddress}::faucet::mint`,
  typeArguments: [coin],
  functionArguments: [amount],
});

