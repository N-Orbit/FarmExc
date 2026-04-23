# Create Decentralized Reputation Oracle (#540)

## Summary

This PR implements the Decentralized Reputation Oracle, which aggregates trust signals from multiple sources into a portable and privacy-preserving reputation score. The feature introduces a robust scoring algorithm, end-to-end Sybil resistance, a community endorsement system, and a foundational Soroban smart contract for on-chain verifiable representation (Reputation NFTs / Soulbound setup).

## Features Implemented

### 1. Multi-Source Signal Aggregation
- **Trust Score Calculation**: Integrates existing trading/project success metrics alongside new community inputs.
- **`EndorsementCalculator`**: Weights endorsements significantly higher when they originate from verified, high-trust score participants.
- **Scoring Formulas**: Base score + endorsement bonus, scaled down dynamically by any sybil-related penalties.

### 2. Sybil Resistance Mechanisms
- **`SybilProfile` Model**: Tracks algorithmic analysis and heuristics data to tag suspicious behavior.
- **`SybilPenaltyCalculator`**: Dynamically penalizes a user's reputation score multiplier based on their Sybil risk score, zeroing out scores for explicitly flagged bots.

### 3. Community Endorsement System
- **`ReputationEndorsement` Model**: Stores the relational context of trusted users endorsing newer users.
- **API Endpoint**: `POST /reputation/endorse` natively increases target scores based on the weight computed via the newly added `EndorsementCalculator`. 

### 4. Dispute Resolution System
- **`ReputationDispute` Model**: Keeps an audit log and state machine (OPEN, RESOLVED_IN_FAVOR, etc.) for contested peer reviews or outcomes, serving as a layer of platform protection against inaccurate ratings.
- **API Endpoint**: `POST /reputation/dispute` to formally open an investigation.

### 5. Privacy-Preserving Proofs
- **Zero-Knowledge Preparation Endpoint**: `GET /reputation/proof/:userId?threshold=X` provides a cryptographically verifiable mechanism proving whether a user's score exceeds a required threshold metric without exposing their absolute values.

### 6. Smart Contract Scaffold
- **Soroban `reputation_oracle`**: Created an initial `Contracts/contracts/reputation_oracle` Cargo project that exposes `update_score` and `get_score` to build Soulbound Tokens syncing seamlessly with off-chain ratings.

## Technical Architecture

### Prisma Entities
- `ReputationActivity` & `ReputationScore`: Migrated away from deprecated TypeORM implementations into full `schema.prisma` support.
- `ReputationEndorsement`
- `ReputationDispute`
- `SybilProfile`

### Services / Controllers
- `ReputationController`: Serves the primary interaction routes for queries and writes.
- `ReputationService`: Central orchestrator caching composite scores into the Prisma database aggressively to prevent high computational overhead.

---

## Testing / Verification Plan

- [x] Run `npm run db:generate` and ensure the Prisma Client typings encapsulate all new Oracle models natively without conflict across user references.
- [x] Build compilation passes (`npm run build`).
- Ensure REST endpoints dynamically aggregate trust factors correctly by interacting with local clients.

## Deployment Notes

Run `npm install` and trigger `npx prisma db push` before deploying this stack since it introduces multiple vital Oracle entity tables alongside migrating legacy TypeORM structures. For the smart contract component, configure standard Soroban network limits and bind the appropriate WASM output. 
