use soroban_sdk::{
    Address, Env, Map, Symbol, Val, Vec, IntoVal,
};

/// Standardized event emitter utility
pub struct EventEmitter;

impl EventEmitter {
    pub const CURRENT_VERSION: u32 = 1;

    /// Emit a standardized event
    pub fn emit_standard(
        env: &Env,
        event_type: Symbol,
        user_address: Address,
        data: Vec<Val>,
        metadata: Map<Symbol, Vec<Val>>,
    ) {
        // Publish standardized event with structured data
        env.events().publish(
            (Symbol::new(env, "stellara_event"), event_type.clone()),
            (
                env.current_contract_address(),
                user_address,
                data,
                metadata,
                env.ledger().timestamp(),
                Self::CURRENT_VERSION,
            ),
        );
    }

    /// Emit a transfer event using standardized format
    pub fn transfer(env: &Env, from: Address, to: Address, amount: i128, token: Address) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Symbol::new(env, "amount"), Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Symbol::new(env, "from"), Vec::from_array(env, [from.into_val(env)]));
        metadata.set(Symbol::new(env, "to"), Vec::from_array(env, [to.into_val(env)]));
        metadata.set(Symbol::new(env, "token"), Vec::from_array(env, [token.into_val(env)]));

        Self::emit_standard(env, Symbol::new(env, "transfer"), from.clone(), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (Symbol::new(env, "transfer"), from.clone(), to),
            amount,
        );
    }

    /// Emit an approval event using standardized format
    pub fn approve(env: &Env, from: Address, spender: Address, amount: i128, token: Address) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Symbol::new(env, "amount"), Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Symbol::new(env, "from"), Vec::from_array(env, [from.into_val(env)]));
        metadata.set(Symbol::new(env, "to"), Vec::from_array(env, [spender.into_val(env)]));
        metadata.set(Symbol::new(env, "token"), Vec::from_array(env, [token.into_val(env)]));

        Self::emit_standard(env, Symbol::new(env, "approve"), from.clone(), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (Symbol::new(env, "approve"), from.clone(), spender),
            amount,
        );
    }

    /// Emit a mint event using standardized format
    pub fn mint(env: &Env, to: Address, amount: i128, token: Address, reason: Option<String>) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Symbol::new(env, "amount"), Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Symbol::new(env, "to"), Vec::from_array(env, [to.into_val(env)]));
        metadata.set(Symbol::new(env, "token"), Vec::from_array(env, [token.into_val(env)]));
        
        if let Some(r) = reason {
            metadata.set(Symbol::new(env, "reason"), Vec::from_array(env, [r.clone().into_val(env)]));
        }

        Self::emit_standard(env, Symbol::new(env, "mint"), to.clone(), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (Symbol::new(env, "mint"), to.clone()),
            amount,
        );
    }

    /// Emit a burn event using standardized format
    pub fn burn(env: &Env, from: Address, amount: i128, token: Address) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Symbol::new(env, "amount"), Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Symbol::new(env, "from"), Vec::from_array(env, [from.into_val(env)]));
        metadata.set(Symbol::new(env, "token"), Vec::from_array(env, [token.into_val(env)]));

        Self::emit_standard(env, Symbol::new(env, "burn"), from.clone(), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (Symbol::new(env, "burn"), from.clone()),
            amount,
        );
    }

    /// Emit an admin change event using standardized format
    pub fn admin_changed(env: &Env, old_admin: Address, new_admin: Address) {
        let mut data = Vec::new(env);
        data.push_back(new_admin.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Symbol::new(env, "from"), Vec::from_array(env, [old_admin.into_val(env)]));
        metadata.set(Symbol::new(env, "to"), Vec::from_array(env, [new_admin.into_val(env)]));

        Self::emit_standard(env, Symbol::new(env, "admin_changed"), old_admin.clone(), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (Symbol::new(env, "admin_changed"), old_admin.clone()),
            new_admin,
        );
    }

    /// Emit an authorization change event using standardized format
    pub fn authorization_changed(env: &Env, user: Address, authorized: bool) {
        let mut data = Vec::new(env);
        data.push_back(authorized.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Symbol::new(env, "to"), Vec::from_array(env, [user.into_val(env)]));

        Self::emit_standard(env, Symbol::new(env, "auth_changed"), user.clone(), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (Symbol::new(env, "auth_changed"), user.clone()),
            authorized,
        );
    }

    /// Emit a proposal created event using standardized format
    pub fn proposal_created(env: &Env, proposer: Address, proposal_id: u64, title: String, proposal_type: Symbol) {
        let mut data = Vec::new(env);
        data.push_back(proposal_id.into_val(env));
        data.push_back(title.clone().into_val(env));
        data.push_back(proposal_type.clone().into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Symbol::new(env, "proposal_id"), Vec::from_array(env, [proposal_id.into_val(env)]));

        Self::emit_standard(env, Symbol::new(env, "propose"), proposer.clone(), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (Symbol::new(env, "propose"), proposer.clone()),
            (proposal_id, title, proposal_type, env.ledger().timestamp()),
        );
    }

    /// Emit a proposal executed event using standardized format
    pub fn proposal_executed(env: &Env, executor: Address, proposal_id: u64, success: bool) {
        let mut data = Vec::new(env);
        data.push_back(proposal_id.into_val(env));
        data.push_back(success.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Symbol::new(env, "proposal_id"), Vec::from_array(env, [proposal_id.into_val(env)]));

        Self::emit_standard(env, Symbol::new(env, "execute"), executor.clone(), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (Symbol::new(env, "execute"), executor.clone()),
            (proposal_id, success, env.ledger().timestamp()),
        );
    }
}

/// Event schema versioning utilities
pub struct EventSchema;

impl EventSchema {
    /// Get current schema version
    pub fn current_version() -> u32 {
        EventEmitter::CURRENT_VERSION
    }

    /// Validate event schema compatibility
    pub fn is_compatible(version: u32) -> bool {
        version <= Self::current_version()
    }
}
