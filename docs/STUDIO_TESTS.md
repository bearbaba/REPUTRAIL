# REPUTRAIL — Studio technical verification

Network: **GenLayer Studionet 61999**. This is a test plan, not a claim of on-chain acceptance.

## Deployment order

1. Deploy \`contracts/service_court.py\` without constructor arguments.
2. Deploy \`contracts/reputation_ledger.py\` with the actual ServiceCourt address string.
3. Configure \`SERVICE_COURT_ADDRESS\` and \`REPUTATION_LEDGER_ADDRESS\` on the server.
4. Check \`ReputationLedger.stats().court\` equals ServiceCourt, both schemas exist and deployed source matches GitHub via the read-only preflight.

## Contestable service path

Use distinct Client and Agent wallets, with a third caller for permissionless recording. Load the "synthetic approved invoice report" fixture from \`src/project.js\`.

1. Client calls \`open_job(agent,agreement,reference_input)\`. Freeze source and contractual expected total 20.
2. Agent signs \`submit_delivery(job_id,delivery,sha256(delivery))\` with a faulty report containing \`approvedTotal:27\`. Check digest and role in \`get_job\`.
3. Client signs \`open_dispute(job_id,claim)\` saying expected total should be 20. Check \`stage=DISPUTED\`.
4. Call \`adjudicate(job_id)\` and record actual independent GenLayer verdict: \`AGENT_AT_FAULT\`, \`CLAIM_UNSUPPORTED\` or \`REVIEW_REQUIRED\`. Do not assume consensus outcome.
5. Only for an eligible verdict, call \`ReputationLedger.record_outcome(job_id)\`; verify \`get_outcome\`, \`outcome_for\`, \`get_profile(agent)\` and \`stats()\`. If \`REVIEW_REQUIRED\`, permission must be false and no reputation event can be recorded.
6. Call \`record_outcome\` a second time. Expected rollback: one outcome per job, profile counters unchanged.

## Direct client acceptance

Open a second job and submit correct approvedTotal 20. Client calls \`accept_delivery(job_id)\` without an AI dispute. Record \`CLIENT_ACCEPTED\`, then append one accepted event. This is a signed client assertion, not AI-certified code quality.

## Additional signed security cases

- Wrong agent wallet cannot submit delivery; bad output hash cannot be saved.
- Wrong client wallet cannot accept delivery or open dispute.
- A second delivery for one job is refused.
- Contested \`REVIEW_REQUIRED\` cannot be counted, even when a third party requests it.
- Dispute \`CLAIM_UNSUPPORTED\` should be tested with a correct report and unsupported claim. Record only the actual consensus outcome.
- Verify eventual ledger totals equal the count of actual unique eligible jobs, not the number of transaction attempts.

## Evidence standard

Keep exact signed transaction hashes, GenVM SUCCESS/ERROR and consensus history separate. After each write, independently inspect persisted \`LATEST_FINAL\` state. A \`FINALIZED\` ERROR indicates expected rollback when testing a guard. Agent is only a signer wallet, not independent proof of a remote AI system or off-chain work.
