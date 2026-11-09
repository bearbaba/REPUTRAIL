# REPUTRAIL — Proof-carrying agent service reputation

**REPUTRAIL records evidence-linked service outcomes instead of asking an AI to invent a reputation score. Signed jobs can be accepted directly by clients or disputed and settled by independent GenLayer consensus. A second contract maintains event counts per agent.**

> **State:** Source implementation and offline tests are available. **No Studionet deployment, on-chain acceptance or website production verification is claimed yet.** The application disables signing until two real contract addresses are configured.

## Workflow

1. Client signs `open_job` with a specific measurable agreement and reference fixture.
2. Agent wallet signs `submit_delivery` with exact SHA-256.
3. Client either signs `accept_delivery`, or signs `open_dispute` with a concrete claim.
4. After a dispute, GenLayer `adjudicate` determines fault, unsupported claim or uncertainty.
5. `record_outcome` stores an eligible event once and increments transparent agent counters in `ReputationLedger`.

## Architecture

- ServiceCourt: client-signed immutable agreement and reference fixture; distinct agent wallet signs a hash-linked delivery; client may accept directly or open a dispute; GenLayer independently returns AGENT_AT_FAULT, CLAIM_UNSUPPORTED or REVIEW_REQUIRED based only on frozen evidence.
- ReputationLedger: permissionless recording of eligible finalized outcomes from the bound Court. Each job records at most once, updating transparent counters for client acceptance, proven faults and unsupported claims. REVIEW_REQUIRED never mutates reputation.

The browser interface uses EIP-1193 wallet signing with GenLayer's JavaScript client. The public serverless read API exposes an allowlist and uses `LATEST_FINAL`; the transaction tracker separately checks `FINALIZED`, GenVM `SUCCESS` and persisted state before reporting verified execution. Incomplete transactions remain stored for manual recheck, preventing duplicate submission attempts.

## Security and acceptance scenarios

**Positive:** Client accepts or AI adjudicates a proven fault → a single evidence-linked ledger event increments the appropriate counter.

**Negative:** Unsigned/wrong-signer submission rejected, bad digest rejected, REVIEW_REQUIRED cannot enter reputation, same job cannot be counted twice, validator disagreement preserves dispute.

Tests are deterministic and mock GenLayer consensus; they are not substitutes for signed validator acceptance. The source includes no private keys, wallet seeds or assumed API secrets.

## Reproduce locally

Node.js >=22, Python >=3.11:

```bash
npm install
npm test
npm run build
python -m unittest discover -s tests -v
python -m py_compile contracts/*.py
```

For local UI, `npm run dev`. On Vercel, set `SERVICE_COURT_ADDRESS` and `REPUTATION_LEDGER_ADDRESS` only after deploying the two real contracts and verifying the constructor linkage. The local Vite development server does not expose Vercel serverless APIs; use the deployed serverless environment for on-chain read/sign workflows.

[Deployment procedure](docs/DEPLOYMENT.md) · [Studio verification checklist](docs/STUDIO_TESTS.md) · [Source: first contract](contracts/service_court.py) · [Source: second contract](contracts/reputation_ledger.py)

## Boundaries

Agent identity is a signing wallet rather than proof of external autonomous operation. Client acceptance is an explicit client claim; AI conflict results use only the signed task, reference and delivery. Reputation counts are recorded events, not a financial credit score or verified real-world service history.

Everything in this repository concerns product behavior, source code, reproducible tests and technical evidence.
