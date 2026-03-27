# Upgrade Timelock Vault — Security Model

## Overview

The Upgrade Timelock Vault (`shared/src/timelock_vault.rs`) separates timelock
storage from contract logic, addressing issue #301. Upgrades are queued in an
isolated vault map and can only execute after a mandatory delay.

## Architecture

```
Admin
  │
  ▼  vault_queue_upgrade(hash, delay ≥ 3600s)
┌──────────────────────────────────────────┐
│  VaultEntry { id, queued_at,             │  ← isolated "vault" storage key
│    execution_time, new_contract_hash,    │     separate from governance "props"
│    status: Queued }                      │
└──────────────────────────────────────────┘
  │                          │
  │ (timelock expires)       │ (admin cancels)
  ▼                          ▼
vault_execute_upgrade()   vault_cancel_upgrade()
  → status: Executed        → status: Cancelled
  → emits VaultExecuteEvent → emits VaultCancelEvent
```

## Storage Isolation

| Key        | Owner              | Contents                        |
|------------|--------------------|---------------------------------|
| `vault`    | TimelockVault      | `Map<u64, VaultEntry>`          |
| `v_cnt`    | TimelockVault      | monotonic entry ID counter      |
| `props`    | GovernanceManager  | `Map<u64, UpgradeProposal>`     |

The vault never reads or writes the `props` key, so a bug in one cannot
corrupt the other.

## Lifecycle & State Machine

```
Queued ──(timelock expired + executor calls execute)──► Executed
Queued ──(admin calls cancel)──────────────────────────► Cancelled
```

Terminal states (`Executed`, `Cancelled`) are irreversible.

## Access Control

| Operation              | Required Role |
|------------------------|---------------|
| `vault_queue_upgrade`  | Admin         |
| `vault_execute_upgrade`| Any assigned role (Admin / Approver / Executor) |
| `vault_cancel_upgrade` | Admin         |
| `vault_get_entry`      | Public (read-only) |

Roles are shared with `GovernanceManager` via the `roles` storage key, so no
duplicate role assignment is needed.

## Minimum Timelock

`TimelockVault::MIN_DELAY = 3600` seconds (1 hour). Attempts to queue with a
shorter delay return `VaultError::InvalidTimelockDelay`.

## Events

| Event topic   | Payload struct       | Emitted when              |
|---------------|----------------------|---------------------------|
| `vlt_queue`   | `VaultQueueEvent`    | Upgrade queued            |
| `vlt_exec`    | `VaultExecuteEvent`  | Upgrade executed          |
| `vlt_cncl`    | `VaultCancelEvent`   | Upgrade cancelled         |

## Relationship to Existing Governance

The vault is a **complementary layer**, not a replacement. The existing
`GovernanceManager` handles multi-sig approval; the vault adds isolated
storage and a dedicated queue mechanism on top. A typical high-security flow:

1. Admin proposes via `propose_upgrade` (multi-sig approval required).
2. Once approved, admin also queues via `vault_queue_upgrade` (timelock starts).
3. After timelock expires, executor calls `vault_execute_upgrade`.

This double-layer ensures both social consensus (multi-sig) and time-delay
(vault timelock) are satisfied before any upgrade takes effect.
