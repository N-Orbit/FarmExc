/// Upgrade Timelock Vault
///
/// Implements a dedicated vault pattern that separates timelock storage from
/// contract logic. Upgrades are queued in isolated vault storage and can only
/// be executed after the timelock period expires. Admins can cancel queued
/// upgrades at any time before execution.
///
/// # Security Model
///
/// ```text
/// ┌─────────────────────────────────────────────────────────┐
/// │                  Timelock Vault                          │
/// │                                                          │
/// │  queue_upgrade()  ──►  VaultEntry { queued_at,          │
/// │                          execution_time, new_hash, ...}  │
/// │                                                          │
/// │  execute_upgrade() ──► checks: execution_time <= now    │
/// │                          then marks executed             │
/// │                                                          │
/// │  cancel_upgrade()  ──► admin-only, marks cancelled,     │
/// │                          emits CancelEvent               │
/// └─────────────────────────────────────────────────────────┘
/// ```
///
/// Storage is isolated under the `"vault"` key, completely separate from the
/// governance proposal map, so a bug in one cannot corrupt the other.
use soroban_sdk::{contracttype, symbol_short, Address, Env, Symbol};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/// A single entry in the upgrade vault queue.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultEntry {
    /// Monotonically increasing identifier.
    pub id: u64,
    /// Address that queued this upgrade.
    pub queued_by: Address,
    /// Wasm hash / contract hash of the new implementation.
    pub new_contract_hash: Symbol,
    /// Human-readable description (max 9 chars due to Symbol limit).
    pub description: Symbol,
    /// Ledger timestamp when the entry was queued.
    pub queued_at: u64,
    /// Earliest ledger timestamp at which execution is allowed.
    pub execution_time: u64,
    /// Current lifecycle state.
    pub status: VaultStatus,
}

/// Lifecycle states for a vault entry.
#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultStatus {
    /// Queued and waiting for timelock to expire.
    Queued = 0,
    /// Successfully executed.
    Executed = 1,
    /// Cancelled by admin before execution.
    Cancelled = 2,
}

/// Error codes specific to the vault.
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    Unauthorized = 3001,
    EntryNotFound = 3002,
    TimelockNotExpired = 3003,
    AlreadyExecuted = 3004,
    AlreadyCancelled = 3005,
    InvalidTimelockDelay = 3006,
}

impl From<VaultError> for soroban_sdk::Error {
    fn from(e: VaultError) -> Self {
        soroban_sdk::Error::from_contract_error(e as u32)
    }
}

// ---------------------------------------------------------------------------
// Events (emitted via env.events().publish)
// ---------------------------------------------------------------------------

/// Emitted when an upgrade is queued.
#[contracttype]
#[derive(Clone, Debug)]
pub struct VaultQueueEvent {
    pub entry_id: u64,
    pub queued_by: Address,
    pub new_contract_hash: Symbol,
    pub execution_time: u64,
}

/// Emitted when a queued upgrade is executed.
#[contracttype]
#[derive(Clone, Debug)]
pub struct VaultExecuteEvent {
    pub entry_id: u64,
    pub executed_by: Address,
    pub new_contract_hash: Symbol,
}

/// Emitted when a queued upgrade is cancelled.
#[contracttype]
#[derive(Clone, Debug)]
pub struct VaultCancelEvent {
    pub entry_id: u64,
    pub cancelled_by: Address,
}

// ---------------------------------------------------------------------------
// Storage helpers (isolated under "vault" namespace)
// ---------------------------------------------------------------------------

fn vault_map(env: &Env) -> soroban_sdk::Map<u64, VaultEntry> {
    let key = symbol_short!("vault");
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| soroban_sdk::Map::new(env))
}

fn save_vault_map(env: &Env, map: &soroban_sdk::Map<u64, VaultEntry>) {
    env.storage()
        .persistent()
        .set(&symbol_short!("vault"), map);
}

fn next_vault_id(env: &Env) -> u64 {
    let key = symbol_short!("v_cnt");
    let current: u64 = env.storage().persistent().get(&key).unwrap_or(0);
    let next = current + 1;
    env.storage().persistent().set(&key, &next);
    next
}

fn require_vault_admin(env: &Env, caller: &Address) {
    // Reuse the same "roles" map that GovernanceManager writes so that the
    // vault respects the same admin assignment without duplicating storage.
    use crate::governance::GovernanceRole;
    let roles_key = symbol_short!("roles");
    let role_map: soroban_sdk::Map<Address, GovernanceRole> = env
        .storage()
        .persistent()
        .get(&roles_key)
        .unwrap_or_else(|| soroban_sdk::Map::new(env));

    let role = role_map
        .get(caller.clone())
        .unwrap_or(GovernanceRole::Executor);

    if role != GovernanceRole::Admin {
        panic!("VAULT_UNAUTH");
    }
}

// ---------------------------------------------------------------------------
// TimelockVault
// ---------------------------------------------------------------------------

pub struct TimelockVault;

impl TimelockVault {
    /// Minimum allowed timelock delay (1 hour).
    pub const MIN_DELAY: u64 = 3_600;

    /// Queue an upgrade in the isolated vault storage.
    ///
    /// Only an address with the `Admin` governance role may call this.
    /// Returns the new vault entry ID.
    pub fn queue_upgrade(
        env: &Env,
        admin: Address,
        new_contract_hash: Symbol,
        description: Symbol,
        timelock_delay: u64,
    ) -> Result<u64, VaultError> {
        require_vault_admin(env, &admin);

        if timelock_delay < Self::MIN_DELAY {
            return Err(VaultError::InvalidTimelockDelay);
        }

        let id = next_vault_id(env);
        let now = env.ledger().timestamp();

        let entry = VaultEntry {
            id,
            queued_by: admin.clone(),
            new_contract_hash: new_contract_hash.clone(),
            description,
            queued_at: now,
            execution_time: now + timelock_delay,
            status: VaultStatus::Queued,
        };

        let mut map = vault_map(env);
        map.set(id, entry.clone());
        save_vault_map(env, &map);

        // Emit queue event
        env.events().publish(
            (symbol_short!("vlt_queue"),),
            VaultQueueEvent {
                entry_id: id,
                queued_by: admin,
                new_contract_hash,
                execution_time: entry.execution_time,
            },
        );

        Ok(id)
    }

    /// Execute a queued upgrade after the timelock period has expired.
    ///
    /// Any address with at least the `Executor` governance role may call this.
    pub fn execute_upgrade(
        env: &Env,
        executor: Address,
        entry_id: u64,
    ) -> Result<VaultEntry, VaultError> {
        // Executors and above are allowed
        {
            use crate::governance::GovernanceRole;
            let roles_key = symbol_short!("roles");
            let role_map: soroban_sdk::Map<Address, GovernanceRole> = env
                .storage()
                .persistent()
                .get(&roles_key)
                .unwrap_or_else(|| soroban_sdk::Map::new(env));
            // Any assigned role is fine; unassigned addresses are rejected
            if role_map.get(executor.clone()).is_none() {
                return Err(VaultError::Unauthorized);
            }
        }

        let mut map = vault_map(env);
        let mut entry = map.get(entry_id).ok_or(VaultError::EntryNotFound)?;

        match entry.status {
            VaultStatus::Executed => return Err(VaultError::AlreadyExecuted),
            VaultStatus::Cancelled => return Err(VaultError::AlreadyCancelled),
            VaultStatus::Queued => {}
        }

        if env.ledger().timestamp() < entry.execution_time {
            return Err(VaultError::TimelockNotExpired);
        }

        entry.status = VaultStatus::Executed;
        map.set(entry_id, entry.clone());
        save_vault_map(env, &map);

        // Emit execute event
        env.events().publish(
            (symbol_short!("vlt_exec"),),
            VaultExecuteEvent {
                entry_id,
                executed_by: executor,
                new_contract_hash: entry.new_contract_hash.clone(),
            },
        );

        Ok(entry)
    }

    /// Cancel a queued upgrade before it is executed.
    ///
    /// Only an address with the `Admin` governance role may cancel.
    pub fn cancel_upgrade(
        env: &Env,
        admin: Address,
        entry_id: u64,
    ) -> Result<(), VaultError> {
        require_vault_admin(env, &admin);

        let mut map = vault_map(env);
        let mut entry = map.get(entry_id).ok_or(VaultError::EntryNotFound)?;

        match entry.status {
            VaultStatus::Executed => return Err(VaultError::AlreadyExecuted),
            VaultStatus::Cancelled => return Err(VaultError::AlreadyCancelled),
            VaultStatus::Queued => {}
        }

        entry.status = VaultStatus::Cancelled;
        map.set(entry_id, entry);
        save_vault_map(env, &map);

        // Emit cancel event
        env.events().publish(
            (symbol_short!("vlt_cncl"),),
            VaultCancelEvent {
                entry_id,
                cancelled_by: admin,
            },
        );

        Ok(())
    }

    /// Retrieve a vault entry by ID.
    pub fn get_entry(env: &Env, entry_id: u64) -> Result<VaultEntry, VaultError> {
        vault_map(env)
            .get(entry_id)
            .ok_or(VaultError::EntryNotFound)
    }
}
