# FarmExchange

> Fund. Grow. Trade.
>
> A decentralized agricultural finance and commodity marketplace built on Stellar.

FarmExchange connects farmers, investors, and agricultural buyers through transparent on-chain financing, milestone-based fund management, and decentralized commodity trading.

Built on the Stellar ecosystem, FarmExchange enables smallholder farmers to access capital, investors to earn returns from agricultural production, and buyers to purchase verified agricultural products using digital assets such as USDC and XLM.

---

## Vision

Millions of farmers struggle to access affordable financing due to limited credit history, lack of collateral, and inefficient financial systems.

FarmExchange aims to bridge this gap by creating a transparent agricultural marketplace where:

- Farmers can raise capital for crop production.
- Investors can fund agricultural projects and earn returns.
- Buyers can purchase verified agricultural products directly from farmers.
- Smart contracts automate escrow, repayments, and revenue distribution.
- Agricultural commerce becomes accessible across borders.

---

## Why Stellar

- **Fast settlement** — sub-5-second finality suits time-sensitive agricultural payments.
- **Low transaction fees** — viable for micro-contributions from smallholder farmers and retail investors.
- **Native asset support** — USDC and XLM move natively without wrapped-token overhead.
- **Soroban smart contracts** — Rust-based contracts handle escrow, milestone logic, and revenue splits.
- **SEP standards** — SEP-12 (KYC), SEP-24 (deposit/withdraw), and SEP-31 (cross-border payments) give us a standardized path to fiat on/off-ramps in target markets.
- **Composability** — FarmExchange can plug into existing Stellar DeFi and identity infrastructure rather than rebuilding it.

---

## Why Blockchain, Not a Centralized Platform

Centralized agri-fintech platforms (e.g., cooperative lending apps, agri-credit fintechs) already exist in this space. FarmExchange differs in three concrete ways:

1. **Cross-border investor access** — anyone holding USDC can fund a campaign without a local bank relationship or platform-specific custodial account.
2. **Verifiable fund tracking** — milestone releases and revenue splits are auditable on-chain, not represented to investors via a dashboard the platform controls.
3. **Composability** — reputation, KYC, and funding-pool positions are portable assets (tokens, DIDs) that other protocols can build on, rather than siloed database records.

The honest tradeoff: centralized platforms are simpler for users today and don't require wallet literacy. Our go-to-market (below) is built around closing that gap rather than assuming it away.

---

## Problem Statement

Traditional agricultural financing faces several challenges:

- Limited access to credit for smallholder farmers.
- High lending risk for financial institutions, with thin credit history to underwrite against.
- Lack of transparency in fund utilization.
- Delayed payments and settlement processes.
- Difficulty connecting farmers directly with buyers.
- Limited investment opportunities in agricultural production for outside capital.

FarmExchange addresses these challenges using blockchain technology and smart contracts on Stellar — paired with an explicit, real-world verification layer (see below), since contracts alone cannot observe a farm.

---

## Pilot

To avoid building a generic three-sided marketplace with no traction, v1 targets a single, narrow pilot:

- **Crop:** Maize (single growing cycle, well-understood milestone structure)
- **Region:** [one state / district — fill in with actual partner geography]
- **Cooperative partner:** [cooperative name], acting as the milestone-verification agent and aggregating ~30–50 smallholder farmers into pooled campaigns
- **Committed off-taker:** [buyer/processor name], reducing marketplace-side uncertainty for the pilot cohort

Everything in this README describes the general protocol; the pilot is the concrete slice we ship and measure first.

---

## Milestone Verification

This is the part most agri-finance-on-blockchain projects gloss over, so we're explicit about it. A Soroban contract has no way to know that planting actually happened — it can only act on data someone feeds it. FarmExchange uses a layered verification model:

| Layer | Mechanism | Phase |
|---|---|---|
| Agent attestation | Cooperative field agents submit milestone completion via a mobile app, with GPS tag + photo evidence, signed with the agent's Stellar key | Phase 1 |
| Agent staking | Agents stake a bond that's slashable if attestations are later found fraudulent | Phase 1 |
| Multi-party sign-off | Disputed or high-value milestones require 2-of-3 sign-off from independent agents before release | Phase 1 |
| Satellite/NDVI oracle | Crop-health imagery cross-checks agent attestations for planting/growth milestones | Phase 2 |
| IoT sensors | Soil moisture / weather station data for larger or higher-value campaigns | Phase 3 |

Funds are held in escrow and released only when verification clears. This is the trust backbone of the entire protocol and is treated as core infrastructure, not a roadmap afterthought.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Crop failure (drought, pests, flooding) | Parametric weather-triggered payout from a pooled risk reserve (see Insurance, below); pooled campaigns spread single-farmer risk across cohort |
| Farmer fraud / disappearance | Identity binding via Stellar1KYC-based DID; cooperative vetting as a precondition for campaign creation; agent staking |
| False or collusive milestone attestation | Agent bonding + slashing; multi-party sign-off; satellite cross-check in Phase 2 |
| Buyer non-payment in marketplace | Escrowed buyer funds released only on delivery confirmation; reputation penalty for buyer defaults |
| Farmer/buyer quality disputes | Defined arbitration path via independent agents; held in escrow pending resolution |
| Investor illiquidity | Tokenized investor positions (see below) allow secondary transfer before harvest completes |
| Regulatory uncertainty around investor returns | Structured as revenue-sharing agreements rather than securities, pending jurisdiction-specific legal review (see Compliance) |
| Smallholder access to wallets/dApps | Cooperative-operated pooled accounts and a mobile-first/USSD interface during onboarding (see Go-to-Market) |

This list is not exhaustive and is expected to grow as the pilot surfaces real failure modes.

---

## Solution

FarmExchange provides an end-to-end agricultural finance ecosystem:

### Agricultural Funding

Farmers — individually or, more commonly in v1, as a cooperative-aggregated pool — create crop funding campaigns for a specific farming cycle (e.g., one maize season). Investors contribute Stellar-based assets toward the campaign target.

### Smart Contract Escrow

Funds are secured in a Soroban contract and released against the milestone-verification pipeline described above (land preparation, seed purchase, planting, fertilizer application, harvesting).

### Tokenized Investor Positions

Each investor contribution mints a transferable token representing their proportional claim on a campaign's future repayment. This means:

- Investors aren't locked in until harvest — they can sell their position on a secondary market if they need liquidity.
- Positions are composable with other Stellar DeFi (e.g., usable as collateral elsewhere), which is a meaningfully different value proposition than a centralized lending dashboard can offer.

### Pooled / Cooperative Campaigns

Rather than funding 50 smallholders as 50 separate campaigns, a cooperative can bundle them into a single pooled campaign. This:

- Reduces per-farmer administrative and verification overhead.
- Spreads investor risk — one farmer's failed plot doesn't sink the whole investment.
- Gives the milestone-verification agent one cooperative relationship to manage instead of dozens.

### Harvest Marketplace

After harvest, farmers list agricultural products (maize, rice, cassava, tomatoes, livestock products, etc.) for sale. Buyers purchase using USDC, XLM, or other Stellar assets, with funds held in escrow until delivery is confirmed.

### Forward Contracts

Buyers can lock in price and quantity ahead of harvest. This gives farmers a guaranteed buyer before they plant and gives buyers price certainty and guaranteed supply — a standard agricultural finance tool, implemented as a Soroban contract instead of an off-chain agreement.

### Parametric Weather Insurance

Rather than relying on manual crop-failure claims, payouts are triggered by objective weather-oracle data (e.g., rainfall falling below a defined threshold during the growing window). A pooled risk reserve, funded by a small protocol fee, issues partial payouts automatically. This is scoped for Phase 1–2, not deferred to a distant "AI risk assessment" phase, since the parametric mechanism doesn't require AI to be useful.

### Automated Revenue Distribution

When harvest sales or forward contracts settle:

1. Buyer payment is received into escrow.
2. The contract calculates investor principal + proportional profit.
3. Investor token holders receive their distribution automatically.
4. Remaining revenue transfers to the farmer/cooperative.
5. A small protocol fee (see Business Model) is routed to the treasury and risk reserve.

No intermediary manually processes this step.

### Reputation System

Farmer (and cooperative, and agent) reputation is recorded as a non-transferable, soulbound-style token bound to their Stellar DID — not a database row inside FarmExchange. This makes reputation portable: a farmer's track record can, in principle, be read by other agri-fintech protocols later, rather than being locked into one platform. Reputation factors include repayment history, project completion rate, funding success rate, historical yields, and agent/community feedback.

### Carbon & Sustainability Add-On (Phase 3)

Campaigns using verified sustainable practices (reduced tillage, intercropping, agroforestry) can register for a small carbon-credit revenue stream layered on top of the harvest proceeds — additional income for the farmer, additional ESG appeal for investors.

---

## Key Features

### For Farmers
- Create individual or cooperative-pooled funding campaigns
- Receive milestone-verified funding via escrow
- Access global investor capital
- Build a portable, on-chain reputation
- Lock in buyers ahead of harvest via forward contracts
- Sell harvests directly through the marketplace
- Receive payments without intermediaries

### For Investors
- Fund agricultural campaigns directly
- Hold a transferable token representing their position (exit liquidity before harvest)
- Earn proportional returns plus parametric insurance protection
- Monitor performance via an off-chain analytics dashboard
- Receive automated distributions at settlement

### For Buyers
- Purchase verified agricultural products
- Lock in forward contracts ahead of harvest
- Transact securely through escrow
- Pay using Stellar assets
- Access producers directly, without intermediary markups

---

## Architecture

```text
farmexchange/
│
├── frontend/
│   ├── web/                       # Next.js investor/farmer/buyer dashboard
│   │   ├── src/
│   │   │   ├── app/                # Routes/pages
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/                # Wallet connection, Stellar SDK client helpers
│   │   │   └── styles/
│   │   └── public/
│   │
│   └── mobile/                    # Field agent + farmer app (milestone attestation, USSD fallback)
│       ├── src/
│       │   ├── screens/
│       │   ├── components/
│       │   └── offline-sync/       # Handles spotty rural connectivity
│       └── assets/
│
├── backend/
│   ├── api/                       # NestJS application server
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── investors/
│   │   │   │   ├── marketplace/
│   │   │   │   ├── kyc/            # Stellar1KYC integration
│   │   │   │   ├── agents/         # Field agent registration, staking status
│   │   │   │   └── notifications/
│   │   │   └── common/
│   │   └── prisma/                 # Schema, migrations
│   │
│   ├── indexer/                    # Off-chain event indexer for dashboards/analytics
│   │   ├── src/
│   │   │   ├── listeners/          # Subscribes to Soroban contract events
│   │   │   └── aggregators/        # Builds queryable views (campaign history, reputation trends)
│   │   └── db/
│   │
│   └── oracle-service/             # Bridges off-chain data (weather, NDVI/satellite) to contracts
│       ├── src/
│       │   ├── weather/
│       │   └── satellite/
│       └── config/
│
├── contracts/
│   ├── funding-pool/                # Campaign creation, deposits, position-token minting
│   ├── escrow/                      # Milestone-gated fund release
│   ├── marketplace/                 # Harvest listings, forward contracts, buyer settlement
│   ├── repayment/                   # Revenue distribution, fee routing
│   ├── insurance/                   # Risk reserve, parametric payout logic
│   ├── reputation/                  # Soulbound reputation tokens
│   └── shared/                      # Common Soroban utils, error types, test helpers
│
├── packages/                        # Cross-cutting shared code (used by both frontend and backend)
│   ├── sdk/                         # TypeScript client for calling contracts
│   ├── shared/                      # Shared business logic, constants
│   └── types/                       # Shared TypeScript types/interfaces
│
├── docs/
│   ├── architecture/
│   ├── contracts/                   # Per-contract spec docs
│   └── pilot/                       # Pilot-specific operational docs (agent onboarding, etc.)
│
├── scripts/                         # Deployment, contract migration, seed data
│
└── README.md
```

---

## Technology Stack

### Frontend
- React, Next.js, TypeScript, Tailwind CSS
- Stellar wallet integration (web)
- Mobile/USSD interface for field agents and farmers with limited smartphone access

### Backend
- NestJS, PostgreSQL, Prisma ORM, Redis
- REST APIs and WebSocket events
- Off-chain indexer (subgraph-style) for historical queries and dashboard analytics — Soroban contract state alone isn't practical for this

### Smart Contracts
- Soroban, Rust, Stellar SDK
- Weather/NDVI oracle integration for milestone cross-checks and parametric insurance triggers

### Blockchain
- Stellar Network, USDC on Stellar, XLM
- SEP-12 for KYC, SEP-24 for fiat on/off-ramp, SEP-31 for cross-border settlement

### Identity
- Integration point with **Stellar1KYC** (our companion "verify once, use everywhere" identity project) for farmer, agent, and — where required — investor verification, avoiding duplicate KYC flows across the ecosystem

---

## Smart Contracts

| Contract | Responsibility | Phase |
|---|---|---|
| Funding Pool | Campaign creation, investor deposits, position-token minting | 1 |
| Escrow | Holds funds, gates release on milestone verification | 1 |
| Repayment | Calculates and distributes investor returns and farmer proceeds, routes protocol fee | 1 |
| Insurance | Holds risk reserve, evaluates oracle data, issues parametric payouts | 1–2 |
| Marketplace | Harvest listings, forward contracts, buyer escrow and settlement | 2 |
| Reputation | Soulbound scoring for farmers, cooperatives, and agents | 1–2 |

---

## User Flow

### Farmer / Cooperative
1. Register and complete KYC (via Stellar1KYC integration).
2. Create a (possibly pooled) farming campaign with defined milestones.
3. Receive milestone-gated funding as verification clears.
4. Produce crops; optionally lock in a forward contract with a buyer.
5. List harvest or fulfill the forward contract.
6. Receive farmer proceeds after investor distribution and fee routing.

### Investor
1. Connect wallet, complete any required verification.
2. Browse campaigns, including risk/insurance terms and cooperative track record.
3. Fund a campaign and receive a position token.
4. Track progress via the dashboard; optionally sell position on secondary market.
5. Receive automated repayment (and any insurance payout) at settlement.

### Buyer
1. Browse harvest listings or available forward contracts.
2. Purchase or lock in a forward contract, paying into escrow.
3. Confirm delivery.
4. Funds release to the farmer/cooperative side of the contract.

### Field Agent (verification role)
1. Register and stake a bond via the mobile app.
2. Visit farm sites at milestone checkpoints.
3. Submit GPS-tagged, photo-evidenced attestations.
4. Participate in multi-party sign-off for disputed or high-value milestones.

---

## Business Model

The protocol sustains itself through:

- A small percentage fee on funding-pool capital raised at campaign close.
- A transaction fee on marketplace sales and forward-contract settlement.
- A portion of fees routed to the insurance risk reserve, keeping it solvent without relying solely on external capital.

This is stated explicitly because a protocol with no revenue model is a feature, not a sustainable business — and we want grant reviewers and future investors to see the path to self-sufficiency up front.

---

## Compliance Approach

Investor contributions are structured as **revenue-sharing agreements** tied to a specific campaign's output, rather than as general-purpose securities. This framing, plus jurisdiction-specific legal review before any public investor onboarding, is a starting position — not a substitute for actual local counsel in each market we operate in.

---

## Go-to-Market

Smallholder farmers are unlikely to be the ones opening a browser wallet and approving Soroban transactions directly. Our approach:

- Cooperative agents operate pooled accounts on behalf of farmers during early onboarding.
- A mobile/USSD interface handles attestation and basic status checks without requiring full wallet literacy.
- Farmers transition to self-custodied positions as trust and familiarity build, rather than this being a precondition for participation.
- Local on/off-ramp partners (via SEP-24) handle the fiat boundary in the pilot region.

---

## Future Roadmap

### Phase 1 — Pilot Core
- Funding pool + escrow + repayment contracts
- Agent-attestation milestone verification with staking and multi-sign-off
- Basic parametric insurance (rainfall trigger, single pilot region)
- Investor dashboard, off-chain indexer
- Soulbound reputation (farmers, agents)
- Pilot launch: one crop, one region, one cooperative, one committed buyer

### Phase 2 — Marketplace & Liquidity
- Harvest marketplace and forward contracts
- Tokenized investor positions with secondary transfer
- Satellite/NDVI oracle cross-checks
- Stellar1KYC integration for streamlined onboarding

### Phase 3 — Scale & Risk Tooling
- Expanded parametric insurance (multiple weather variables, IoT sensor inputs)
- Carbon/sustainability revenue add-on
- Yield prediction models informed by accumulated on-chain history
- Commodity tokenization

### Phase 4 — Ecosystem
- Cross-border agricultural trade between regions
- Secondary investment marketplace
- DAO governance over protocol fees and risk-reserve parameters

---

## Impact

FarmExchange aims to:

- Increase financial inclusion for smallholder farmers.
- Unlock global agricultural investment with real exit liquidity.
- Improve transparency in agricultural financing through on-chain, verifiable milestone tracking.
- Reduce payment inefficiencies between farmers, investors, and buyers.
- Create sustainable agricultural markets backed by parametric risk protection rather than informal, unenforceable arrangements.

---


