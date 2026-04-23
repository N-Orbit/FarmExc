#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationData {
    pub score: u32,
    pub timestamp: u64,
}

#[contract]
pub struct ReputationOracle;

#[contractimpl]
impl ReputationOracle {
    pub fn update_score(env: Env, user_id: String, score: u32) {
        let mut data: ReputationData = env
            .storage()
            .persistent()
            .get(&user_id)
            .unwrap_or(ReputationData {
                score: 0,
                timestamp: 0,
            });

        data.score = score;
        data.timestamp = env.ledger().timestamp();

        env.storage().persistent().set(&user_id, &data);
    }

    pub fn get_score(env: Env, user_id: String) -> u32 {
        let data: ReputationData = env
            .storage()
            .persistent()
            .get(&user_id)
            .unwrap_or(ReputationData {
                score: 0,
                timestamp: 0,
            });
        data.score
    }
}
