#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env, IntoVal};

#[test]
fn test_liquidity_pool_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    // Deploy two mock tokens
    let token_a = env.register_stellar_asset_contract(admin.clone());
    let token_b = env.register_stellar_asset_contract(admin.clone());
    let lp_token = env.register_stellar_asset_contract(admin.clone());

    // Deploy the liquidity pool contract
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    // Initialize the pool
    client.initialize(&token_a, &token_b, &lp_token, &30);

    // Mint some initial tokens to user
    let token_a_client = token::Client::new(&env, &token_a);
    let token_b_client = token::Client::new(&env, &token_b);

    token_a_client.mint(&user, &1000_000_000);
    token_b_client.mint(&user, &1000_000_000);

    // Add initial liquidity
    let lp_minted = client.add_liquidity(&user, &100_000_000, &100_000_000);
    assert!(lp_minted > 0);

    // Check reserves
    let reserves = client.get_reserves();
    assert_eq!(reserves.reserve_a, 100_000_000);
    assert_eq!(reserves.reserve_b, 100_000_000);

    // Swap A for B
    let amount_out = client.swap(&user, &token_a, &10_000_000, &0);
    // x = 100M, y = 100M, dx = 10M, fee = 0.3%
    // dx_with_fee = 10M * (1 - 0.003) = 9,970,000
    // dy = (100M * 9,970,000) / (100M + 9,970,000) = 997,000,000,000,000 / 109,970,000 = 9,066,108
    assert!(amount_out > 9_000_000);

    // Check updated reserves
    let reserves = client.get_reserves();
    assert_eq!(reserves.reserve_a, 110_000_000);
    assert_eq!(reserves.reserve_b, 100_000_000 - amount_out);

    // Remove liquidity
    let (received_a, received_b) = client.remove_liquidity(&user, &lp_minted);
    assert!(received_a > 0);
    assert!(received_b > 0);

    // Check final reserves (should be near 0)
    let reserves = client.get_reserves();
    assert_eq!(reserves.reserve_a, 0);
    assert_eq!(reserves.reserve_b, 0);
}
