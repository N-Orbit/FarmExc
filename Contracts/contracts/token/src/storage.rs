use soroban_sdk::{Address, Env, Map, Symbol};

const ADMIN_KEY: Symbol = Symbol::short("ADMIN");
const BALANCE_KEY: Symbol = Symbol::short("BAL");

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&ADMIN_KEY)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&ADMIN_KEY, admin);
}

pub fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&ADMIN_KEY)
        .expect("Admin not set")
}

pub fn set_balance(env: &Env, addr: &Address, amount: &i128) {
    let mut balances: Map<Address, i128> = env
        .storage()
        .instance()
        .get(&BALANCE_KEY)
        .unwrap_or_else(|| Map::new(env));

    balances.set(addr.clone(), amount.clone());
    env.storage().instance().set(&BALANCE_KEY, &balances);
}

pub fn balance_of(env: &Env, addr: &Address) -> i128 {
    let balances: Map<Address, i128> = env
        .storage()
        .instance()
        .get(&BALANCE_KEY)
        .unwrap_or_else(|| Map::new(env));

    balances.get(addr.clone()).unwrap_or(0)
}
