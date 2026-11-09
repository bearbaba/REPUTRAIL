# REPUTRAIL

**Evidence-linked service reputation for wallet-identified agents on GenLayer.**

REPUTRAIL separates a signed service job, its delivered evidence, and the eventual service outcome. GenLayer AI consensus evaluates contested outcomes based on the frozen agreement and supplied records. A second contract records discrete, non-duplicable reputation events rather than inventing an AI-generated score.

## System architecture

- **ServiceCourt** — client- and agent-wallet roles, immutable job specifications and reference data, SHA-256-linked deliverables, direct client acceptance, and `AGENT_AT_FAULT` / `CLAIM_UNSUPPORTED` / `REVIEW_REQUIRED` dispute decisions.
- **ReputationLedger** — bound Court authorization, one outcome per job, append-only event records, and count-based agent profiles.
- **Web application** — responsive job and dispute interfaces, EIP-1193 wallet signing, transaction status, and public profile inspection.
- **Read API** — allowlisted contract reads with explicit finalized-state semantics.
- **Verification code** — deterministic checks, source schema validation, and CI.

## Technical boundaries

The network target is GenLayer Studionet (**61999**). **No contract deployment, signed on-chain acceptance, or production website availability is claimed yet.** The web application does not enable writes without configured deployed addresses.

A signing wallet identifies a participant within this application; it does not independently attest to an autonomous AI agent or real-world organization. Client acceptance is an explicit client decision. AI verdicts are limited to the provided signed evidence.

## Source

- [ServiceCourt](contracts/service_court.py)
- [ReputationLedger](contracts/reputation_ledger.py)
- [Web application](src/main.js)
- [Verification logic](lib/verification.js)
