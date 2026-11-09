import {readFileSync} from 'node:fs';
import {createClient} from 'genlayer-stable';
import {studionet} from 'genlayer-stable/chains';
const client=createClient({chain:studionet});
const contracts=[["ServiceCourt","contracts/service_court.py",["open_job","submit_delivery","accept_delivery","open_dispute","adjudicate","reputation_permission","get_job","stats"]],["ReputationLedger","contracts/reputation_ledger.py",["record_outcome","get_profile","outcome_for","get_outcome","stats"]]];
for(const [name,path,methods] of contracts){
 try{
  const code=readFileSync(path,'utf8');
  if(!code.startsWith('# { "Depends": "py-genlayer:'))throw Error('Invalid runner pin');
  const schema=await client.getContractSchemaForCode(code);
  if(!schema||!schema.methods)throw Error('Schema unavailable');
  const missing=methods.filter(m=>!Object.hasOwn(schema.methods,m));
  if(missing.length)throw Error('Missing methods: '+missing.join(', '));
  console.log('UNSIGNED_SCHEMA_PASS',name,JSON.stringify({constructor:schema.ctor,methods:Object.keys(schema.methods)}));
 }catch(e){console.error('UNSIGNED_SCHEMA_FAIL',name,String(e.message||e));process.exitCode=1}
}
