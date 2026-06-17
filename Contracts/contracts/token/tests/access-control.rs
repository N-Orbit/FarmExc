use soroban_sdk::{testutils::Address as _, Address, Env};
use token::TokenContract;

#[test]
#[should_panic(expected = "Unauthorized")]
fn non_admin_cannot_mint() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let attacker = Address::generate(&env);

    TokenContract::initialize(env.clone(), admin);

    // attacker tries mint
    TokenContract::mint(env, attacker, 100);
}
