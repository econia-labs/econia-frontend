module contract_address::coin_factory {
    use aptos_std::coin::{Self};
    use aptos_std::string;
    use std::signer::{address_of};

    struct CoinStruct {}

    const MAX_U64: u64 = 18446744073709551615;
    const MAX_U64_AS_U128: u128 = 18446744073709551615;

    /// There was a general error with the contract.
    const E_CONTRACT_ERROR: u64 = 0;
    /// You are not the publisher of the contract.
    const E_NOT_PUBLISHER: u64 = 1;

    public entry fun mint_initial_supply(
        account: &signer,
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        monitor_supply: bool,
        amount: u128,
    ) {
        assert!(address_of(account) == @contract_address, E_NOT_PUBLISHER);
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<CoinStruct>(
            account,
            string::utf8(name),
            string::utf8(symbol),
            decimals,
            monitor_supply
        );

        let remaining = amount;
        assert!(MAX_U64 == (MAX_U64_AS_U128 as u64), E_CONTRACT_ERROR);

        coin::register<CoinStruct>(account);

        while (remaining > MAX_U64_AS_U128) {
            let minted_coins = coin::mint<CoinStruct>(MAX_U64, &mint_cap);
            coin::deposit(address_of(account), minted_coins);
            remaining = remaining - MAX_U64_AS_U128;
        };

        let minted_coins = coin::mint<CoinStruct>((remaining as u64), &mint_cap);
        coin::deposit(address_of(account), minted_coins);

        // Destroy all coin capabilities, because we will not need them.
        coin::destroy_freeze_cap<CoinStruct>(freeze_cap);
        coin::destroy_mint_cap<CoinStruct>(mint_cap);
        coin::destroy_burn_cap<CoinStruct>(burn_cap);
    }
}
