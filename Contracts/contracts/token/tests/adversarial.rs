use soroban_sdk::{testutils::Address as _, Address, Env};
use token::TokenContract;

#[test]
#[should_panic(expected = "Overflow")]
fn mint_overflow_attack() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    TokenContract::initialize(env.clone(), admin.clone());

    TokenContract::mint(env, admin, i128::MAX);
}
