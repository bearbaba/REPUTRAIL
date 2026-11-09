"""Offline tests simulate GenLayer execution and role security, not signed consensus."""
import hashlib
import importlib.util
import json
import pathlib
import sys
import types
import unittest

CLIENT="0x"+"1"*40
AGENT="0x"+"2"*40
OTHER="0x"+"3"*40
COURT="0x"+"4"*40
class Address:
    def __init__(self,v):self.as_hex=v.as_hex.lower() if hasattr(v,"as_hex") else str(v).lower()
class Return:
    def __init__(self,v):self.calldata=v
class Contract:
    def __new__(cls,*args,**kwargs):
        c=super().__new__(cls)
        for name,k in cls.__annotations__.items():
            if getattr(k,"__origin__",None) is dict:setattr(c,name,{})
        return c
class Runtime:
    def __init__(self):
        self.answer="AGENT_AT_FAULT";self.sequence=None;self.calls=0;self.contracts={}
        self.message=types.SimpleNamespace(sender_address=types.SimpleNamespace(as_hex=CLIENT))
        self.vm=types.SimpleNamespace(UserError=ValueError,Return=Return,run_nondet_unsafe=self.agree)
        self.nondet=types.SimpleNamespace(exec_prompt=self.respond)
        self.public=types.SimpleNamespace(write=lambda fn:fn,view=lambda fn:fn)
        self.Contract=Contract
    def respond(self,_prompt):
        if self.sequence:
            result=self.sequence[self.calls%len(self.sequence)]
            self.calls+=1
            return result
        return self.answer
    def agree(self,leader,validator):
        value=leader()
        if not validator(Return(value)):raise ValueError("consensus disagreement")
        return value
    def get_contract_at(self,addr):return self.contracts[addr.as_hex]
runtime=Runtime()
mod=types.ModuleType("genlayer")
mod.gl=runtime;mod.TreeMap=dict;mod.Address=Address;mod.u256=int
sys.modules["genlayer"]=mod

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,pathlib.Path(__file__).parents[1]/path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module
court_module=load("service_court","contracts/service_court.py")
ledger_module=load("reputation_ledger","contracts/reputation_ledger.py")
AGREEMENT=("An agent must produce a JSON report of the two approved invoice IDs INV-1 and INV-3, "
           "and compute their correct approvedTotal of 20 from amounts 12 and 8. "
           "Any report with a wrong total or missing an approved ID violates this agreement.")
REFERENCE='{"invoices":[{"id":"INV-1","amount":12,"approved":true},{"id":"INV-3","amount":8,"approved":true}]}'
FAULT='{"approvedIds":["INV-1","INV-3"],"approvedTotal":27,"notes":"wrong synthetic amount"}'
CORRECT='{"approvedIds":["INV-1","INV-3"],"approvedTotal":20,"notes":"correct synthetic amount"}'
CLAIM="The delivery reports total 27 but the locked source has amounts 12 and 8 only, so the correct approved total must be 20."
def sha(s):return hashlib.sha256(s.encode("utf-8")).hexdigest()

class Workflow(unittest.TestCase):
    def setUp(self):
        runtime.answer="AGENT_AT_FAULT";runtime.sequence=None;runtime.calls=0
        self.c=court_module.ServiceCourt()
        self.l=ledger_module.ReputationLedger(COURT)
        runtime.contracts={COURT:self.c}
        self.actor(CLIENT)
        self.jid=self.c.open_job(AGENT,AGREEMENT,REFERENCE)
    def actor(self,who):runtime.message.sender_address.as_hex=who
    def deliver(self,payload=FAULT):
        self.actor(AGENT)
        return self.c.submit_delivery(self.jid,payload,sha(payload))
    def dispute(self):
        self.actor(CLIENT);self.c.open_dispute(self.jid,CLAIM)
    def verdict(self,result="AGENT_AT_FAULT"):
        runtime.answer=result;self.actor(OTHER)
        return self.c.adjudicate(self.jid)
    def profile(self):return json.loads(self.l.get_profile(AGENT))
    def test_signed_fault_and_reputation_record_once(self):
        self.deliver();self.dispute()
        self.assertEqual(self.verdict(),"AGENT_AT_FAULT")
        self.assertTrue(json.loads(self.c.reputation_permission(self.jid))["allowed"])
        self.assertEqual(self.l.record_outcome(self.jid),1)
        self.assertEqual(self.profile()["faults"],1)
        self.assertEqual(self.profile()["total"],1)
        with self.assertRaisesRegex(ValueError,"already recorded"):self.l.record_outcome(self.jid)
        self.assertEqual(json.loads(self.l.outcome_for(self.jid))["verdict"],"AGENT_AT_FAULT")
    def test_uncontested_client_accepted_is_not_ai_quality_certification(self):
        self.deliver(CORRECT);self.actor(CLIENT)
        self.c.accept_delivery(self.jid)
        self.assertEqual(json.loads(self.c.get_job(self.jid))["verdict"],"CLIENT_ACCEPTED")
        self.l.record_outcome(self.jid)
        self.assertEqual(self.profile()["accepted"],1)
    def test_claim_unsupported_is_counted_separately(self):
        self.deliver(CORRECT);self.dispute()
        self.assertEqual(self.verdict("CLAIM_UNSUPPORTED"),"CLAIM_UNSUPPORTED")
        self.l.record_outcome(self.jid)
        self.assertEqual(self.profile()["rejected_claims"],1)
        self.assertEqual(self.profile()["faults"],0)
    def test_inconclusive_decision_does_not_change_reputation(self):
        self.deliver();self.dispute()
        self.assertEqual(self.verdict("REVIEW_REQUIRED"),"REVIEW_REQUIRED")
        self.assertFalse(json.loads(self.c.reputation_permission(self.jid))["allowed"])
        with self.assertRaisesRegex(ValueError,"not eligible"):self.l.record_outcome(self.jid)
        self.assertEqual(self.profile()["total"],0)
    def test_unauthorized_client_and_agent_actions(self):
        self.actor(AGENT)
        with self.assertRaisesRegex(ValueError,"client only"):
            self.c.open_dispute(self.jid,CLAIM)
        self.actor(OTHER)
        with self.assertRaisesRegex(ValueError,"assigned agent only"):
            self.c.submit_delivery(self.jid,FAULT,sha(FAULT))
        self.deliver()
        self.actor(OTHER)
        with self.assertRaisesRegex(ValueError,"client only"):
            self.c.accept_delivery(self.jid)
        with self.assertRaisesRegex(ValueError,"client only"):
            self.c.open_dispute(self.jid,CLAIM)
    def test_content_integrity_and_unique_delivery(self):
        self.actor(AGENT)
        with self.assertRaisesRegex(ValueError,"hash mismatch"):
            self.c.submit_delivery(self.jid,FAULT,"0"*64)
        self.deliver()
        with self.assertRaisesRegex(ValueError,"window closed"):
            self.c.submit_delivery(self.jid,FAULT,sha(FAULT))
    def test_consensus_disagreement_keeps_dispute(self):
        self.deliver();self.dispute();runtime.sequence=["AGENT_AT_FAULT","CLAIM_UNSUPPORTED"]
        with self.assertRaisesRegex(ValueError,"consensus disagreement"):
            self.c.adjudicate(self.jid)
        j=json.loads(self.c.get_job(self.jid))
        self.assertEqual(j["stage"],"DISPUTED")
        self.assertEqual(j["verdict"],"PENDING")
    def test_identity_collision_rejected(self):
        self.actor(CLIENT)
        with self.assertRaisesRegex(ValueError,"must be distinct"):
            self.c.open_job(CLIENT,AGREEMENT,REFERENCE)
if __name__=="__main__":unittest.main()
