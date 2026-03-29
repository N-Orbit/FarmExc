#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol,
};

use shared::events::{
    topics, LiquidityAddedEvent, LiquidityRemovedEvent, SwapExecutedEvent,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InsufficientBalance = 5,
    InsufficientLiquidity = 6,
    InsufficientOutputAmount = 7,
    IdenticalAddresses = 8,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolConfig {
    pub token_a: Address,
    pub token_b: Address,
    pub lp_token: Address,
    pub fee_bps: u32, // Fee in basis points (e.g., 30 for 0.3%)
}

mod keys {
    use soroban_sdk::{symbol_short, Symbol};
    pub const CONFIG: Symbol = symbol_short!("CONFIG");
    pub const RESERVES: Symbol = symbol_short!("RESERVES");
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Reserves {
    pub reserve_a: i128,
    pub reserve_b: i128,
}

mod test;

/// Simple integer square root implementation
fn sqrt(y: i128) -> i128 {
    if y > 3 {
        let mut z = y;
        let mut x = y / 2 + 1;
        while x < z {
            z = x;
            x = (y / x + x) / 2;
        }
        z
    } else if y != 0 {
        1
    } else {
        0
    }
}

#[contract]
pub struct LiquidityPoolContract;

#[contractimpl]
impl LiquidityPoolContract {
    /// Initialize the liquidity pool with two tokens and a fee configuration
    pub fn initialize(
        env: Env,
        token_a: Address,
        token_b: Address,
        lp_token: Address,
        fee_bps: u32,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&keys::CONFIG) {
            return Err(Error::AlreadyInitialized);
        }

        if token_a == token_b {
            return Err(Error::IdenticalAddresses);
        }

        let config = PoolConfig {
            token_a,
            token_b,
            lp_token,
            fee_bps,
        };

        env.storage().instance().set(&keys::CONFIG, &config);
        env.storage().instance().set(
            &keys::RESERVES,
            &Reserves {
                reserve_a: 0,
                reserve_b: 0,
            },
        );

        Ok(())
    }

    /// Add liquidity to the pool
    pub fn add_liquidity(
        env: Env,
        user: Address,
        amount_a_max: i128,
        amount_b_max: i128,
    ) -> Result<i128, Error> {
        user.require_auth();

        let config: PoolConfig = env.storage().instance().get(&keys::CONFIG).ok_or(Error::NotInitialized)?;
        let mut reserves: Reserves = env.storage().instance().get(&keys::RESERVES).unwrap();

        let lp_token_client = token::Client::new(&env, &config.lp_token);
        let total_lp = lp_token_client.total_supply();

        let (amount_a, amount_b, lp_to_mint) = if total_lp == 0 {
            // Initial liquidity: Geometric mean
            let lp_to_mint = sqrt(amount_a_max * amount_b_max);
            (amount_a_max, amount_b_max, lp_to_mint)
        } else {
            // Subsequent liquidity: Maintain constant product ratio
            let amount_b_optimal = (amount_a_max * reserves.reserve_b) / reserves.reserve_a;
            if amount_b_optimal <= amount_b_max {
                let lp_to_mint = (amount_a_max * total_lp) / reserves.reserve_a;
                (amount_a_max, amount_b_optimal, lp_to_mint)
            } else {
                let amount_a_optimal = (amount_b_max * reserves.reserve_a) / reserves.reserve_b;
                let lp_to_mint = (amount_b_max * total_lp) / reserves.reserve_b;
                (amount_a_optimal, amount_b_max, lp_to_mint)
            }
        };

        if lp_to_mint <= 0 {
            return Err(Error::InsufficientLiquidity);
        }

        // Transfer tokens from user to pool
        let token_a_client = token::Client::new(&env, &config.token_a);
        let token_b_client = token::Client::new(&env, &config.token_b);

        token_a_client.transfer(&user, &env.current_contract_address(), &amount_a);
        token_b_client.transfer(&user, &env.current_contract_address(), &amount_b);

        // Mint LP tokens to user
        // Note: The pool contract must be the admin of the lp_token or have minting rights
        lp_token_client.mint(&user, &lp_to_mint);

        // Update reserves
        reserves.reserve_a += amount_a;
        reserves.reserve_b += amount_b;
        env.storage().instance().set(&keys::RESERVES, &reserves);

        // Emit event
        env.events().publish(
            (topics::LIQUIDITY_DEPOSITED, user.clone()),
            LiquidityAddedEvent {
                provider: user,
                amount_a,
                amount_b,
                lp_minted: lp_to_mint,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(lp_to_mint)
    }

    /// Remove liquidity from the pool
    pub fn remove_liquidity(env: Env, user: Address, lp_amount: i128) -> Result<(i128, i128), Error> {
        user.require_auth();

        let config: PoolConfig = env.storage().instance().get(&keys::CONFIG).ok_or(Error::NotInitialized)?;
        let mut reserves: Reserves = env.storage().instance().get(&keys::RESERVES).unwrap();

        let lp_token_client = token::Client::new(&env, &config.lp_token);
        let total_lp = lp_token_client.total_supply();

        if lp_amount <= 0 || lp_amount > total_lp {
            return Err(Error::InvalidAmount);
        }

        let amount_a = (lp_amount * reserves.reserve_a) / total_lp;
        let amount_b = (lp_amount * reserves.reserve_b) / total_lp;

        if amount_a <= 0 || amount_b <= 0 {
            return Err(Error::InsufficientLiquidity);
        }

        // Burn LP tokens from user
        lp_token_client.burn(&user, &lp_amount);

        // Transfer tokens from pool to user
        let token_a_client = token::Client::new(&env, &config.token_a);
        let token_b_client = token::Client::new(&env, &config.token_b);

        token_a_client.transfer(&env.current_contract_address(), &user, &amount_a);
        token_b_client.transfer(&env.current_contract_address(), &user, &amount_b);

        // Update reserves
        reserves.reserve_a -= amount_a;
        reserves.reserve_b -= amount_b;
        env.storage().instance().set(&keys::RESERVES, &reserves);

        // Emit event
        env.events().publish(
            (topics::LIQUIDITY_WITHDRAWN, user.clone()),
            LiquidityRemovedEvent {
                provider: user,
                amount_a,
                amount_b,
                lp_burned: lp_amount,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok((amount_a, amount_b))
    }

    /// Swap tokens
    pub fn swap(
        env: Env,
        user: Address,
        token_in: Address,
        amount_in: i128,
        min_amount_out: i128,
    ) -> Result<i128, Error> {
        user.require_auth();

        let config: PoolConfig = env.storage().instance().get(&keys::CONFIG).ok_or(Error::NotInitialized)?;
        let mut reserves: Reserves = env.storage().instance().get(&keys::RESERVES).unwrap();

        let (reserve_in, reserve_out, is_a_to_b) = if token_in == config.token_a {
            (reserves.reserve_a, reserves.reserve_b, true)
        } else if token_in == config.token_b {
            (reserves.reserve_b, reserves.reserve_a, false)
        } else {
            return Err(Error::Unauthorized);
        };

        if amount_in <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Calculate output amount using CPMM formula: (x + dx) * (y - dy) = x * y
        // dy = y * dx / (x + dx)
        // With fee: dy = y * (dx * (1 - fee)) / (x + dx * (1 - fee))
        let amount_in_with_fee = amount_in * (10000 - config.fee_bps as i128);
        let numerator = amount_in_with_fee * reserve_out;
        let denominator = (reserve_in * 10000) + amount_in_with_fee;
        let amount_out = numerator / denominator;

        if amount_out < min_amount_out {
            return Err(Error::InsufficientOutputAmount);
        }

        // Transfer tokens
        let token_in_client = token::Client::new(&env, &token_in);
        let token_out_client = token::Client::new(&env, if is_a_to_b { &config.token_b } else { &config.token_a });

        token_in_client.transfer(&user, &env.current_contract_address(), &amount_in);
        token_out_client.transfer(&env.current_contract_address(), &user, &amount_out);

        // Update reserves
        if is_a_to_b {
            reserves.reserve_a += amount_in;
            reserves.reserve_b -= amount_out;
        } else {
            reserves.reserve_b += amount_in;
            reserves.reserve_a -= amount_out;
        }
        env.storage().instance().set(&keys::RESERVES, &reserves);

        // Emit event
        env.events().publish(
            (topics::SWAP_EXECUTED, user.clone()),
            SwapExecutedEvent {
                swapper: user,
                token_in,
                token_out: if is_a_to_b { config.token_b } else { config.token_a },
                amount_in,
                amount_out,
                fee_amount: (amount_in * config.fee_bps as i128) / 10000,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(amount_out)
    }

    /// Get current reserves
    pub fn get_reserves(env: Env) -> Result<Reserves, Error> {
        env.storage().instance().get(&keys::RESERVES).ok_or(Error::NotInitialized)
    }

    /// Get pool configuration
    pub fn get_config(env: Env) -> Result<PoolConfig, Error> {
        env.storage().instance().get(&keys::CONFIG).ok_or(Error::NotInitialized)
    }

    /// Get user's pool share percentage (scaled by 10000, 10000 = 100%)
    pub fn get_user_share(env: Env, user: Address) -> Result<u32, Error> {
        let config: PoolConfig = env.storage().instance().get(&keys::CONFIG).ok_or(Error::NotInitialized)?;
        let lp_token_client = token::Client::new(&env, &config.lp_token);
        
        let total_lp = lp_token_client.total_supply();
        if total_lp == 0 {
            return Ok(0);
        }

        let user_lp = lp_token_client.balance(&user);
        let share = (user_lp * 10000) / total_lp;
        
        Ok(share as u32)
    }
}
