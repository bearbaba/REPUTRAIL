# Studionet deployment and source verification

Network: **GenLayer Studionet 61999**. Deploy `contracts/service_court.py` first, then `contracts/reputation_ledger.py` with its constructor parameter set to the **actual** first contract address.

The repository contains no verified deployed addresses as of initialization. Do **not** fabricate successful transaction hashes or state. Configure Vercel environment variables `SERVICE_COURT_ADDRESS` and `REPUTATION_LEDGER_ADDRESS` only after both deployments. Keep frontend server-side config and browser signing on Studionet.

Run local verification:

```bash
npm install
npm test
npm run build
python -m py_compile contracts/*.py
```

After deployment, run a read-only source/schema/linkage check:

```bash
FIRST_SOURCE_PATH=contracts/service_court.py SECOND_SOURCE_PATH=contracts/reputation_ledger.py SECOND_LINK_FIELD=court \\
SERVICE_COURT_ADDRESS=0x... REPUTATION_LEDGER_ADDRESS=0x... npm run preflight
```

Evidence must include source parity, methods, actual signed transactions, GenVM execution result, validator consensus, and `LATEST_FINAL` state. A transaction with `FINALIZED` and `ERROR` is a rollback, not a successful write.
