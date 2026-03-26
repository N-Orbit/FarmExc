#![no_std]

use shared::governance::{GovernanceRole, UpgradeProposal, ProposalStatus, GovernanceError};
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec, Map};

/// Version of this contract implementation
const CONTRACT_VERSION: u32 = 1;

/// Storage keys as constants to avoid repeated symbol creation
mod storage_keys {
    use soroban_sdk::{symbol_short, Symbol};

    pub const INIT: Symbol = symbol_short!("init");
    pub const ROLES: Symbol = symbol_short!("roles");
    pub const VERSION: Symbol = symbol_short!("ver");
    pub const PROPOSAL_COUNT: Symbol = symbol_short!("prop_cnt");
    pub const QUEUED_PROPOSALS: Symbol = symbol_short!("queued");
}

/// Upgrade Timelock Vault - Separates timelock storage from contract logic
#[contract]
pub struct UpgradeTimelockVault;

/// Queued upgrade proposal in the vault
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QueuedUpgrade {
    pub proposal: UpgradeProposal,
    pub queued_at: u64,
    pub can_execute_at: u64,
    pub cancelled: bool,
    pub refund_recipient: Option<Address>,
}

/// Events emitted by the timelock vault
#[contracttype]
pub struct UpgradeQueuedEvent {
    pub proposal_id: u64,
    pub target_contract: Address,
    pub queued_at: u64,
    pub can_execute_at: u64,
}

#[contracttype]
pub struct UpgradeExecutedEvent {
    pub proposal_id: u64,
    pub target_contract: Address,
    pub executed_at: u64,
}

#[contracttype]
pub struct UpgradeCancelledEvent {
    pub proposal_id: u64,
    pub target_contract: Address,
    pub cancelled_at: u64,
    pub refund_recipient: Option<Address>,
}

/// Timelock vault error codes
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TimelockError {
    NotInitialized = 4001,
    Unauthorized = 4002,
    ProposalNotFound = 4003,
    AlreadyQueued = 4004,
    NotQueued = 4005,
    TimelockNotExpired = 4006,
    AlreadyExecuted = 4007,
    AlreadyCancelled = 4008,
    InvalidTimelockDelay = 4009,
}

impl From<TimelockError> for soroban_sdk::Error {
    fn from(error: TimelockError) -> Self {
        soroban_sdk::Error::from_contract_error(error as u32)
    }
}

fn require_initialized(env: &Env) -> Result<(), TimelockError> {
    if env.storage().persistent().has(&storage_keys::INIT) {
        Ok(())
    } else {
        Err(TimelockError::NotInitialized)
    }
}

fn require_role(env: &Env, address: &Address, required_role: GovernanceRole) -> Result<(), TimelockError> {
    let roles: Map<Address, GovernanceRole> = env
        .storage()
        .persistent()
        .get(&storage_keys::ROLES)
        .ok_or(TimelockError::Unauthorized)?;

    let user_role = roles.get(address.clone()).ok_or(TimelockError::Unauthorized)?;

    if user_role > required_role {
        return Err(TimelockError::Unauthorized);
    }

    Ok(())
}

#[contractimpl]
impl UpgradeTimelockVault {
    /// Initialize the timelock vault
    pub fn init(
        env: Env,
        admin: Address,
        approvers: Vec<Address>,
        executor: Address,
    ) -> Result<(), TimelockError> {
        if env.storage().persistent().has(&storage_keys::INIT) {
            return Err(TimelockError::Unauthorized);
        }

        let mut roles = Map::new(&env);
        roles.set(admin, GovernanceRole::Admin);
        for approver in approvers.iter() {
            roles.set(approver, GovernanceRole::Approver);
        }
        roles.set(executor, GovernanceRole::Executor);

        let storage = env.storage().persistent();
        storage.set(&storage_keys::INIT, &true);
        storage.set(&storage_keys::ROLES, &roles);
        storage.set(&storage_keys::VERSION, &CONTRACT_VERSION);
        storage.set(&storage_keys::PROPOSAL_COUNT, &0u64);

        Ok(())
    }

    /// Queue an upgrade proposal in the vault (admin only)
    pub fn queue_upgrade(
        env: Env,
        admin: Address,
        proposal: UpgradeProposal,
        timelock_delay: u64,
    ) -> Result<u64, TimelockError> {
        admin.require_auth();
        require_initialized(&env)?;
        require_role(&env, &admin, GovernanceRole::Admin)?;

        if timelock_delay == 0 {
            return Err(TimelockError::InvalidTimelockDelay);
        }

        // Validate proposal is approved
        if proposal.status != ProposalStatus::Approved {
            return Err(TimelockError::Unauthorized);
        }

        let storage = env.storage().persistent();

        // Get next vault proposal ID
        let vault_proposal_id: u64 = storage.get(&storage_keys::PROPOSAL_COUNT).unwrap_or(0) + 1;

        let now = env.ledger().timestamp();
        let queued_upgrade = QueuedUpgrade {
            proposal,
            queued_at: now,
            can_execute_at: now + timelock_delay,
            cancelled: false,
            refund_recipient: None,
        };

        // Store in vault
        let queued_key = (storage_keys::QUEUED_PROPOSALS, vault_proposal_id);
        storage.set(&queued_key, &queued_upgrade);

        // Update counter
        storage.set(&storage_keys::PROPOSAL_COUNT, &vault_proposal_id);

        // Emit event
        let event = UpgradeQueuedEvent {
            proposal_id: vault_proposal_id,
            target_contract: queued_upgrade.proposal.target_contract,
            queued_at: now,
            can_execute_at: queued_upgrade.can_execute_at,
        };
        env.events().publish((symbol_short!("upgrade_queued"),), event);

        Ok(vault_proposal_id)
    }

    /// Execute a queued upgrade (executor only, after timelock)
    pub fn execute_upgrade(
        env: Env,
        vault_proposal_id: u64,
        executor: Address,
    ) -> Result<(), TimelockError> {
        executor.require_auth();
        require_initialized(&env)?;
        require_role(&env, &executor, GovernanceRole::Executor)?;

        let storage = env.storage().persistent();
        let queued_key = (storage_keys::QUEUED_PROPOSALS, vault_proposal_id);

        let mut queued_upgrade: QueuedUpgrade = storage
            .get(&queued_key)
            .ok_or(TimelockError::ProposalNotFound)?;

        if queued_upgrade.cancelled {
            return Err(TimelockError::AlreadyCancelled);
        }

        if queued_upgrade.proposal.executed {
            return Err(TimelockError::AlreadyExecuted);
        }

        // Check timelock
        let now = env.ledger().timestamp();
        if now < queued_upgrade.can_execute_at {
            return Err(TimelockError::TimelockNotExpired);
        }

        // Mark as executed
        queued_upgrade.proposal.executed = true;
        queued_upgrade.proposal.status = ProposalStatus::Executed;
        storage.set(&queued_key, &queued_upgrade);

        // Emit event
        let event = UpgradeExecutedEvent {
            proposal_id: vault_proposal_id,
            target_contract: queued_upgrade.proposal.target_contract,
            executed_at: now,
        };
        env.events().publish((symbol_short!("upgrade_executed"),), event);

        Ok(())
    }

    /// Cancel a queued upgrade with refund capability (admin only)
    pub fn cancel_upgrade(
        env: Env,
        vault_proposal_id: u64,
        admin: Address,
        refund_recipient: Option<Address>,
    ) -> Result<(), TimelockError> {
        admin.require_auth();
        require_initialized(&env)?;
        require_role(&env, &admin, GovernanceRole::Admin)?;

        let storage = env.storage().persistent();
        let queued_key = (storage_keys::QUEUED_PROPOSALS, vault_proposal_id);

        let mut queued_upgrade: QueuedUpgrade = storage
            .get(&queued_key)
            .ok_or(TimelockError::ProposalNotFound)?;

        if queued_upgrade.cancelled {
            return Err(TimelockError::AlreadyCancelled);
        }

        if queued_upgrade.proposal.executed {
            return Err(TimelockError::AlreadyExecuted);
        }

        // Mark as cancelled
        queued_upgrade.cancelled = true;
        queued_upgrade.refund_recipient = refund_recipient.clone();
        storage.set(&queued_key, &queued_upgrade);

        // Emit event
        let event = UpgradeCancelledEvent {
            proposal_id: vault_proposal_id,
            target_contract: queued_upgrade.proposal.target_contract,
            cancelled_at: env.ledger().timestamp(),
            refund_recipient,
        };
        env.events().publish((symbol_short!("upgrade_cancelled"),), event);

        Ok(())
    }

    /// Get a queued upgrade by vault proposal ID
    pub fn get_queued_upgrade(env: Env, vault_proposal_id: u64) -> Result<QueuedUpgrade, TimelockError> {
        require_initialized(&env)?;

        let queued_key = (storage_keys::QUEUED_PROPOSALS, vault_proposal_id);
        env.storage()
            .persistent()
            .get(&queued_key)
            .ok_or(TimelockError::ProposalNotFound)
    }

    /// Get current contract version
    pub fn get_version(env: Env) -> u32 {
        env.storage()
            .persistent()
            .get(&storage_keys::VERSION)
            .unwrap_or(0)
    }

    /// Check if an upgrade can be executed (timelock expired and not cancelled/executed)
    pub fn can_execute(env: Env, vault_proposal_id: u64) -> Result<bool, TimelockError> {
        require_initialized(&env)?;

        let queued_key = (storage_keys::QUEUED_PROPOSALS, vault_proposal_id);
        let queued_upgrade: QueuedUpgrade = env.storage()
            .persistent()
            .get(&queued_key)
            .ok_or(TimelockError::ProposalNotFound)?;

        let can_execute = !queued_upgrade.cancelled
            && !queued_upgrade.proposal.executed
            && env.ledger().timestamp() >= queued_upgrade.can_execute_at;

        Ok(can_execute)
    }
}