# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""ReputationLedger: count discrete verified service outcomes, never invented AI scores."""
from genlayer import *
import json
import re

def require(ok: bool, why: str):
    if not ok:
        raise gl.vm.UserError(why)

def wallet(value: str) -> str:
    require(type(value) is str and re.fullmatch(r"0x[a-fA-F0-9]{40}", value) is not None,
            "invalid wallet")
    return Address(value).as_hex.lower()

class ReputationLedger(gl.Contract):
    court: Address
    outcome_count: u256
    outcomes: TreeMap[u256, str]
    outcome_by_job: TreeMap[u256, u256]
    profiles: TreeMap[str, str]

    def __init__(self, court_address: str):
        self.court = Address(court_address)
        self.outcome_count = u256(0)

    @gl.public.write
    def record_outcome(self, job_id: int) -> int:
        require(type(job_id) is int and job_id > 0, "invalid job")
        require(self.outcome_by_job.get(u256(job_id), u256(0)) == u256(0),
                "job outcome already recorded")
        court = gl.get_contract_at(self.court)
        raw = court.view().reputation_permission(job_id)
        require(type(raw) is str and 1 < len(raw) <= 1500, "invalid Court permission")
        auth = json.loads(raw)
        require(auth.get("allowed") is True and auth.get("job_id") == job_id,
                "outcome not eligible for recording")
        verdict = auth.get("verdict")
        require(verdict in ("CLIENT_ACCEPTED", "AGENT_AT_FAULT", "CLAIM_UNSUPPORTED"),
                "unsupported outcome")
        agent, client = wallet(auth.get("agent")), wallet(auth.get("client"))
        require(agent != client, "agent and client identity collision")
        self.outcome_count += u256(1)
        i = int(self.outcome_count)
        self.outcomes[u256(i)] = json.dumps({
            "id": i, "job_id": job_id, "agent": agent, "client": client,
            "verdict": verdict, "agreement_sha256": auth["agreement_sha256"],
            "delivery_sha256": auth["delivery_sha256"]
        }, sort_keys=True, separators=(",", ":"))
        self.outcome_by_job[u256(job_id)] = u256(i)
        old = self.profiles.get(agent, "")
        p = json.loads(old) if old else {
            "agent": agent, "total": 0, "accepted": 0, "faults": 0,
            "rejected_claims": 0
        }
        p["total"] += 1
        if verdict == "CLIENT_ACCEPTED":
            p["accepted"] += 1
        elif verdict == "AGENT_AT_FAULT":
            p["faults"] += 1
        else:
            p["rejected_claims"] += 1
        self.profiles[agent] = json.dumps(p, sort_keys=True, separators=(",", ":"))
        return i

    @gl.public.view
    def get_profile(self, agent: str) -> str:
        agent = wallet(agent)
        raw = self.profiles.get(agent, "")
        return raw if raw else json.dumps({
            "agent": agent, "total": 0, "accepted": 0, "faults": 0,
            "rejected_claims": 0
        }, sort_keys=True, separators=(",", ":"))

    @gl.public.view
    def outcome_for(self, job_id: int) -> str:
        require(type(job_id) is int and job_id > 0, "invalid job")
        index = self.outcome_by_job.get(u256(job_id), u256(0))
        return self.outcomes[index] if index != u256(0) else ""

    @gl.public.view
    def get_outcome(self, outcome_id: int) -> str:
        require(type(outcome_id) is int and 0 < outcome_id <= int(self.outcome_count),
                "unknown outcome")
        return self.outcomes[u256(outcome_id)]

    @gl.public.view
    def stats(self) -> str:
        return json.dumps({"outcomes": int(self.outcome_count),
                           "court": self.court.as_hex}, sort_keys=True, separators=(",", ":"))
