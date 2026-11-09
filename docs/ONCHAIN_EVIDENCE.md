# REPUTRAIL — Verified GenLayer Studionet evidence

**Chain:** GenLayer Studionet (61999)  
**Verification:** independent public transaction receipt and `LATEST_FINAL` contract reads. This document records observed signed activity; it does not assert an unobserved end-to-end outcome.

## Deployed contracts

| Component | Address |
| --- | --- |
| ServiceCourt | [`0xD64b7cb41416BefA082f753EC762095d61607457`](https://explorer-studio.genlayer.com/address/0xD64b7cb41416BefA082f753EC762095d61607457) |
| ReputationLedger | [`0x30eaf3F2f0482D4120113aD177e9359fdBe82376`](https://explorer-studio.genlayer.com/address/0x30eaf3F2f0482D4120113aD177e9359fdBe82376) |

The read-only deployed-source and constructor-binding verification is available in the repository's `verify-studionet.yml` GitHub Actions workflow. The registry's on-chain `stats().court` points to the ServiceCourt above.

## Signed execution — Service Job #1

| Field | Observed value |
| --- | --- |
| Method | `ServiceCourt.open_job(agent,agreement,reference_input)` |
| Transaction | [`0x6f844f8ca9e6a0e62b62bdbf05d2524cdde3c9d1254492fdb162a61eede91460`](https://explorer-studio.genlayer.com/tx/0x6f844f8ca9e6a0e62b62bdbf05d2524cdde3c9d1254492fdb162a61eede91460) |
| Client / signer | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| Assigned agent | `0xD6b8A3A5eB329410D9504784812b8569afA8C2aF` |
| Contract | `0xD64b7cb41416BefA082f753EC762095d61607457` |
| Result | `FINALIZED`, GenVM `SUCCESS`, consensus `Accepted` |
| Return value | Job ID `1` |

The frozen agreement requires a JSON report listing the approved invoice IDs with `approvedTotal=20`, derived from two approved invoices `INV-1=12` and `INV-3=8`; `INV-2=7` is excluded.

Independent `LATEST_FINAL` readback of `ServiceCourt.get_job(1)` confirmed:

- `id=1`, `stage=OPEN`, `verdict=PENDING`.
- `client=0x4c7cb73ac8f8999af21cfc9ff4cf2333a9508dcb`, `agent=0xd6b8a3a5eb329410d9504784812b8569afa8c2af`.
- `agreement_sha256=7b92cc561473808a68c17bf6c97912e733b0423e1a1a5f0edc474dd208ce9ab8`.
- `reference_sha256=29ffb6f8372c85575c9f1bb4a1d11408f86c458b9c6102f7fad106c4d8656544`.
- No delivery, claim or verdict was yet recorded.
- `ServiceCourt.stats().jobs=1`; `ReputationLedger.stats().outcomes=0`.

**Proof boundary:** This transaction proves one client-signed service job was created with a fixed agreement and an assigned agent. It does not yet establish delivery, dispute adjudication, AI consensus verdict, or a recorded reputation event.


## Signed execution — Agent delivery for Job #1

| Field | Observed value |
| --- | --- |
| Method | `ServiceCourt.submit_delivery(1,delivery,delivery_sha256)` |
| Transaction | [`0xe9f80265f978e6d0ee7bbe62567552c1e1d6afc56d47572c2b89588469db5a4a`](https://explorer-studio.genlayer.com/tx/0xe9f80265f978e6d0ee7bbe62567552c1e1d6afc56d47572c2b89588469db5a4a) |
| Signer / agent | `0xD6b8A3A5eB329410D9504784812b8569afA8C2aF` |
| Contract | `0xD64b7cb41416BefA082f753EC762095d61607457` |
| Execution | `FINALIZED`, GenVM `SUCCESS`, consensus `Accepted` |
| Return value | `null` — successful state-changing call |
| Delivery SHA-256 | `7cfe8dbf70a9f3a9a82a32aeeea81ade23683458ebe1b560f8bdedfebe4f6897` |

The signed JSON delivery was:
```json
{"approvedIds":["INV-1","INV-3"],"approvedTotal":27,"description":"Synthetic agent report with an incorrect approved total."}
```

Independent `LATEST_FINAL` readback from `get_job(1)` returned `stage=DELIVERED`, `verdict=PENDING`, the exact submitted JSON delivery, and the exact SHA-256 digest above. The original frozen agreement and reference fixture remained unchanged; the agreement requires `approvedTotal=20`. `ServiceCourt.stats().jobs=1`.

**Proof boundary:** This proves Agent-signed submission and persisted delivery evidence, not a verdict that the agent is at fault. A client dispute and separate finalized AI adjudication are required before assigning responsibility. No ledger outcome is claimed at this step.


## Signed execution — Client dispute for Job #1

| Field | Observed value |
| --- | --- |
| Method | `ServiceCourt.open_dispute(1, claim)` |
| Transaction | [`0xcad77aa8d1d7e9635fbb8b9d8dcf28733eb2a0f19a4ca9a37a9cb53d323cac91`](https://explorer-studio.genlayer.com/tx/0xcad77aa8d1d7e9635fbb8b9d8dcf28733eb2a0f19a4ca9a37a9cb53d323cac91) |
| Client / signer | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| Contract | `0xD64b7cb41416BefA082f753EC762095d61607457` |
| Execution | `FINALIZED`, GenVM `SUCCESS` (consensus `Accepted`) |
| Return value | `null` (successful state-changing call) |

The signed client claim was:

> The signed report has approvedTotal=27, but the locked source has only approved invoices INV-1=12 and INV-3=8, totaling exactly 20. The delivery violates the explicit total requirement; decide responsibility from these frozen facts.

An independent `LATEST_FINAL` read of `get_job(1)` confirmed `stage=DISPUTED`, `verdict=PENDING`, unchanged `client` and `agent` addresses, the exact stored client claim, and the previously signed delivery and hashes. `ServiceCourt.stats().jobs=1`.

**Proof boundary:** This records a client-signed dispute and intact disputed facts; the AI Consensus judgment and any ledger reputation outcome remain unobserved at this stage.
