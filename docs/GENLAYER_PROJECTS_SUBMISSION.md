# REPUTRAIL — GenLayer Projects Submission

**Contribution type:** Builder → Projects → Project  
**Project name:** REPUTRAIL  
**Primary theme:** AI Agents / Trust & Reputation  
**Additional themes:** Dispute Resolution; Intelligent Contracts  
**Demo video:** https://youtu.be/qPUA0a00aHA  
**Live application:** https://reputrail.vercel.app/  
**Source code:** https://github.com/bearbaba/REPUTRAIL  
**Network:** GenLayer Studionet (chain ID 61999)

## One-liner

Evidence-backed AI agent dispute resolution and on-chain reputation, powered by GenLayer consensus.

## Project description

REPUTRAIL is an evidence-linked accountability platform for wallet-identified AI agent services, built around GenLayer Intelligent Contracts. Clients create signed service jobs with immutable requirements and reference evidence; designated agents submit SHA-256-linked deliveries. When an outcome is contested, GenLayer AI consensus evaluates the frozen agreement, reference input, delivery and dispute claim to reach a contract-recorded decision. A separate ReputationLedger turns eligible decisions into one-time, append-only reputation events associated with the agent wallet. A live web app brings together job creation, delivery, disputes, adjudication, transaction receipts and public reputation profiles.

## Who is it for?

REPUTRAIL is designed for AI agent builders, clients commissioning agent-delivered work, and applications that need verifiable service accountability. It offers a concrete on-chain record of what was agreed, what was submitted, how a dispute was decided and how the result affected the agent's service history.

## How it works

1. **Open a job — Client wallet:** The client signs `open_job`, locking a service agreement, reference input and designated agent wallet in ServiceCourt.
2. **Submit delivery — Agent wallet:** The designated agent signs `submit_delivery`, providing the delivery and its SHA-256 digest. The contract verifies the digest and the agent's role.
3. **Open dispute — Client wallet:** The client signs `open_dispute` to contest the submitted work against the original agreement.
4. **Adjudicate — GenLayer AI consensus:** An `adjudicate` transaction makes GenLayer validators evaluate the frozen evidence. ServiceCourt records an explicit verdict.
5. **Record reputation — Client wallet in the demo:** `record_outcome` reads the eligible Court decision and appends a single immutable outcome to ReputationLedger. Duplicate outcomes for the same job are blocked.

## Technical details

- **ServiceCourt — Python GenLayer Intelligent Contract:** wallet-scoped client and agent actions; immutable agreement and reference evidence; SHA-256 delivery verification; direct acceptance or a contested decision path; consensus outcomes `AGENT_AT_FAULT`, `CLAIM_UNSUPPORTED` and `REVIEW_REQUIRED`.
- **ReputationLedger — Python GenLayer Intelligent Contract:** cross-contract view of the Court's authorization; one outcome per job; append-only evidence-linked events; count-based agent reputation profiles.
- **Frontend:** Vite and JavaScript with `genlayer-js`, EIP-1193 wallet signing, responsive job/dispute interfaces, contract readbacks and transaction status.
- **Verification:** finalized-success checks, stored-state verification, schema validation and automated tests.
- **Network:** GenLayer Studionet, chain ID `61999`.

## Demonstration / proof of execution

**Job #2** is a new, filmed five-transaction workflow using separate Client and Agent wallets. The reference invoice total is **20** (12 + 8), while the agent-submitted approved total is **27**. The client disputes the mismatch, proceeds through GenLayer adjudication and records the eligible service outcome in ReputationLedger. The video captures signing interactions and transaction receipts. Inspect contract state or the linked explorer records for the exact finalized verdict.

**Video:** https://youtu.be/qPUA0a00aHA

**ServiceCourt deployment:** https://explorer-studio.genlayer.com/address/0xD64b7cb41416BefA082f753EC762095d61607457

**ReputationLedger deployment:** https://explorer-studio.genlayer.com/address/0x30eaf3F2f0482D4120113aD177e9359fdBe82376

## Reviewer verification

1. Watch the signed Job #2 walkthrough in the demo video.
2. Open the deployed ServiceCourt and ReputationLedger pages in GenLayer Studio Explorer.
3. Review `ServiceCourt.get_job(2)` for the job participants, agreement, delivery, claim, stage and consensus verdict.
4. Review `ReputationLedger.outcome_for(2)` for the recorded job outcome and evidence digests, and `ReputationLedger.get_profile(agent)` for the agent's count-based record.
5. Inspect the corresponding source files and transaction-verification logic in the public repository.

## Links

- Repository: https://github.com/bearbaba/REPUTRAIL
- Application: https://reputrail.vercel.app/
- Demo: https://youtu.be/qPUA0a00aHA
- ServiceCourt source: https://github.com/bearbaba/REPUTRAIL/blob/main/contracts/service_court.py
- ReputationLedger source: https://github.com/bearbaba/REPUTRAIL/blob/main/contracts/reputation_ledger.py
- Verification workflow: https://github.com/bearbaba/REPUTRAIL/actions/workflows/verify-studionet.yml
