import './style.css';
import {project} from './project.js';
import {parseValue,classifyTx,verifyStored} from '../lib/verification.js';
import {readHistory,rememberTx,updateTxStatus,displayStatus,HASH_RE} from '../lib/tx-history.js';
import {createClient} from 'genlayer-stable';
import {studionet} from 'genlayer-stable/chains';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ADDRESS=/^0x[a-fA-F0-9]{40}$/;
const CHAIN=61999, txPrefix='https://explorer-studio.genlayer.com/tx/';
const pendingKey=project.id+'-pending-write-v1';
const txStorage=()=>window.localStorage;
let config=null,account='',busy=false,checking=false;
const same=(x,y)=>String(x).toLowerCase()===String(y).toLowerCase();
const short=x=>ADDRESS.test(x||'')?x.slice(0,6)+'…'+x.slice(-4):'Connect wallet';
function field([key,title,kind],method){
 const id='f_'+method+'_'+key;
 const common='id="'+id+'" name="'+key+'" required ';
 const input=kind==='textarea'?'<textarea '+common+' rows="4"></textarea>':
  '<input '+common+' type="'+(kind==='number'?'number':'text')+'" '+(kind==='number'?'min="1" step="1"':'')+
  ' placeholder="'+(kind==='address'?'0x…':kind==='hash'?'sha256 of exact content':'')+'">';
 return '<label class="'+(kind==='textarea'?'wide':'')+'">'+esc(title)+input+'</label>';
}
function formHTML(action){
 const index=project.forms.findIndex(x=>x.method===action.method);
 const tag=index<2?'INTAKE':index<4?'DISPUTE':'RESOLUTION';
 const mark=index===3?'AI CONSENSUS':action.scope==='second'?'LEDGER':'SIGNED ACTION';
 return '<article class="action"><div class="actionTop"><div class="action-id">'+String(index+1).padStart(2,'0')+'</div><div class="action-intro"><div class="action-meta">'+tag+' / '+esc(mark)+'</div><h2>'+esc(action.title)+'</h2><p class="hint">'+esc(action.subtitle)+'</p></div><span class="role">'+esc(action.role)+'</span></div>'+
 '<form data-form="'+esc(action.method)+'"><div class="fields">'+action.fields.map(f=>field(f,action.method)).join('')+'</div>'+
 '<div class="actionFooter">'+(action.preset?'<button class="secondary" type="button" data-fill="'+esc(action.method)+'">Use sample data</button>':'')+
 (action.hashSource?'<button class="secondary" type="button" data-digest="'+esc(action.method)+'">Generate digest</button>':'')+
 '<small>GENLAYER / SIGNED CALL</small><button type="submit" class="primary" data-sign>Execute & verify <span aria-hidden="true">↗</span></button></div></form></article>';
}
function render(){
 document.title='REPUTRAIL — Agent trust operations';

 const methodTabs=project.forms.map((a,i)=>'<button type="button" data-case-tab="'+esc(a.method)+'" role="tab" aria-selected="false" aria-controls="case_'+esc(a.method)+'"><span class="case-tab-index">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+esc(a.title)+'</strong><small>'+esc(a.role)+'</small></span></button>').join('');
 const methodPanels=project.forms.map(a=>'<section class="case-form-panel" id="case_'+esc(a.method)+'" data-case-panel="'+esc(a.method)+'" role="tabpanel" hidden>'+formHTML(a)+'</section>').join('');
 const queryOptions=project.reads.map((r,i)=>'<option value="'+i+'">'+esc(r[0])+'</option>').join('');
 $('app').innerHTML=
 '<div class="ops-app"><aside class="ops-sidebar"><a href="#overview" class="ops-brand"><span class="ops-mark">R<span>↗</span></span><span>REPUTRAIL<small>AGENT TRUST NETWORK</small></span></a>'+
 '<div class="sidebar-caption">OPERATIONS</div><nav class="nav" aria-label="Main navigation">'+
 '<button type="button" class="active" data-page="overview"><span class="nav-symbol">◫</span> Command center <span class="nav-index">01</span></button>'+
 '<button type="button" data-page="workflow"><span class="nav-symbol">⤳</span> Case operations <span class="nav-index">02</span></button>'+
 '<button type="button" data-page="explorer"><span class="nav-symbol">⌁</span> Evidence terminal <span class="nav-index">03</span></button>'+ 
 '<button type="button" data-page="transactions"><span class="nav-symbol">▤</span> Transactions <span class="nav-index">04</span></button></nav>'+
 '<div class="sidebar-caption" style="margin-top:38px">PROTOCOL MODULES</div><div class="sidebar-modules"><div><span>SC</span> ServiceCourt <b>ACTIVE SOURCE</b></div><div><span>RL</span> ReputationLedger <b>ACTIVE SOURCE</b></div></div>'+
 '<div class="sidebar-bottom"><div class="system-indicator"><i></i> GENLAYER STUDIO / 61999</div><p>All displayed outcomes must be verified from final on-chain records.</p><a href="https://github.com/bearbaba/REPUTRAIL" target="_blank" rel="noopener">VIEW SOURCE <span>↗</span></a></div></aside>'+
 '<div class="ops-workspace"><header class="ops-topbar"><div class="breadcrumb"><span>REPUTRAIL</span><span class="slash">/</span><span id="breadcrumb">Command center</span></div>'+
 '<div class="top-actions"><span class="network" id="network">Checking contracts…</span><button type="button" class="wallet" id="wallet">Connect operator wallet ↗</button></div></header>'+
 '<div class="ops-layout"><main class="ops-main">'+
 '<section class="page" id="overview"><div class="ops-hero"><div class="hero-copy"><div class="eyebrow"><span class="live-pulse"></span> THE ON-CHAIN TRUST LAYER FOR AGENTS</div>'+
 '<h1>Receipts.<br>Not <em>reputation theater.</em></h1><p>Real service evidence. Independent decisions. No fabricated trust scores. Every agent outcome traces back to a signed case.</p>'+
 '<div class="buttons"><button class="primary" type="button" data-page="workflow">Open case operations <span aria-hidden="true">↗</span></button><button class="secondary" type="button" data-page="explorer">Inspect records →</button></div></div>'+
 '<div class="hero-graphic"><div class="scan-head"><span>TRUST PIPELINE / LIVE SCHEMA</span><span>R–61999</span></div>'+
 '<div class="pulse-diagram"><div class="signal-node signal-a"><small>01 / INPUT</small><b>SIGNED JOB</b><span>Client + agent</span></div>'+
 '<div class="signal-route"><span></span><span class="route-dot">●</span></div><div class="signal-node signal-b"><small>02 / EVALUATE</small><b>AI CONSENSUS</b><span>Independent validators</span></div>'+
 '<div class="signal-route"><span></span><span class="route-dot">●</span></div><div class="signal-node signal-c"><small>03 / OUTPUT</small><b>LEDGER EVENT</b><span>Single-use evidence</span></div></div>'+
 '<div class="scan-foot"><span>ILLUSTRATION / NO LIVE CASE IMPLIED</span><span>INTEGRITY > OPINION</span></div></div></div>'+
 '<div class="signal-stats"><div class="stat"><small>01 / NETWORK</small><strong>61999</strong><span>GenLayer Studionet</span></div>'+
 '<div class="stat"><small>02 / CONTRACT STATUS</small><strong id="deployState">CHECKING</strong><span>Source linkage validated separately</span></div>'+
 '<div class="stat"><small>03 / ON-CHAIN JOBS</small><strong id="liveJobs">—</strong><span>Read from ServiceCourt</span></div>'+
 '<div class="stat"><small>04 / RECORDED OUTCOMES</small><strong id="liveOutcomes">—</strong><span>Read from ReputationLedger</span></div></div>'+
 '<section class="caseboard"><div class="caseboard-title"><div><div class="eyebrow">SERVICE INTEGRITY / WORKFLOW</div><h2>Inside the evidence trail</h2></div><span class="read-only-pill">DESIGN REFERENCE</span></div>'+
 '<div class="case-lanes"><article><small>PHASE 01</small><div class="lane-icon">↗</div><h3>Commit</h3><p>Client signs the job terms; agent signs the exact output and its digest.</p><span class="lane-foot">IMMUTABLE INPUT</span></article>'+
 '<article><small>PHASE 02</small><div class="lane-icon">≋</div><h3>Contest</h3><p>The client can accept delivery or freeze a concrete dispute for consensus.</p><span class="lane-foot">DISPUTE / ACCEPT</span></article>'+
 '<article><small>PHASE 03</small><div class="lane-icon">◎</div><h3>Resolve</h3><p>Independent validators reach a bounded verdict using the supplied evidence.</p><span class="lane-foot">CONSENSUS REQUIRED</span></article>'+
 '<article><small>PHASE 04</small><div class="lane-icon">▣</div><h3>Record</h3><p>One eligible outcome updates transparent counts. No automatic AI score.</p><span class="lane-foot">ONE EVENT PER JOB</span></article></div></section>'+
 '<div class="boundary-note"><strong>DATA BOUNDARY //</strong><p>'+esc(project.scope)+'</p></div></section>'+
 '<section class="page" id="workflow" hidden><div class="workflow-heading"><div class="eyebrow">CASE OPERATIONS / SIGNED WRITES</div><h1>From claim<br>to <span>accountability.</span></h1><p>One signed operation at a time. Verify the final on-chain result before proceeding.</p></div>'+
 '<div id="workflowNotice" class="notice warning">Checking deployed contract configuration…</div>'+
 '<div id="caseMessage" class="case-message" role="status" hidden></div>'+
 '<div class="case-gate" id="caseGate"><span class="gate-mark">↗</span><div><h2>Connect to operate</h2><p>Use a wallet on GenLayer Studionet to create and resolve signed cases. Public evidence reads do not require a wallet.</p></div><button class="primary" type="button" id="caseConnect">Connect operator wallet ↗</button></div>'+
 '<div id="caseConsole" class="case-console" hidden><div id="caseSigner" class="case-signer">No operator connected</div>'+
 '<div class="case-workspace"><nav class="case-tablist" role="tablist" aria-label="Case operations">'+methodTabs+'</nav>'+
 '<div class="case-work-panel"><div class="case-work-head"><span>CONTRACT OPERATIONS / STUDIONET</span><span id="caseMode">SELECT OPERATION</span></div>'+methodPanels+'</div></div></div></section>'+
 '<section class="page" id="explorer" hidden><div class="terminal-heading"><div class="eyebrow">READONLY / GENLAYER LATEST_FINAL</div><h1>Evidence<br><span>terminal.</span></h1><p>Read actual jobs, outcomes and agent profiles from the chain. No wallet signature is required.</p></div>'+
 '<div class="terminal-card"><div class="terminal-bar"><span><i></i> CHAIN QUERY CONSOLE</span><span>RPC / STUDIONET</span></div>'+
 '<div class="terminal-content"><form id="readForm" class="readForm"><div class="fields"><label class="wide">Choose a query<select id="readMethod">'+queryOptions+'</select></label>'+
 '<label>Case / record ID<input id="readId" type="number" value="1" min="1" step="1"></label><label>Wallet address<input id="readActor" type="text" placeholder="0x…"></label></div>'+
 '<button class="primary" type="submit">Run on-chain read ↗</button></form>'+
 '<div class="json-head"><span>RETURN DATA</span><span>FINALIZED VIEW</span></div><pre id="readResult" class="readResult">{"status":"awaiting query"}</pre></div></div></section>'+
 '<section class="page" id="transactions" hidden><div class="terminal-heading"><div class="eyebrow">TRANSACTION JOURNAL / STUDIONET 61999</div><h1>Signed.<br><span>Traceable.</span></h1><p>New signed transactions are saved in this browser automatically. Import any older transaction by its public hash and verify its current execution status without connecting a wallet.</p></div>'+
 '<div class="history-stats"><div><small>LOCAL TRANSACTIONS</small><strong id="txCount">0</strong><span>This browser only · up to 100 entries</span></div><div><small>FINALITY POLICY</small><strong>FINALIZED ≠ SUCCESS</strong><span>GenVM execution and state verification remain distinct</span></div></div>'+
 '<section class="history-panel"><div class="history-header"><div><small>ACTIVITY / 61999</small><h2>Recent signatures</h2></div><button id="refreshHistory" type="button">Refresh statuses ↻</button></div>'+
 '<p class="history-note">Only transactions signed or imported here after this feature was added appear automatically. Earlier transactions cannot be recovered from local storage if their hashes were not saved.</p>'+
 '<div id="txHistoryList" class="history-list" aria-live="polite"></div></section>'+
 '<section class="history-panel"><div class="history-header"><div><small>PUBLIC HASH LOOKUP</small><h2>Verify a receipt</h2></div></div>'+
 '<form id="importHistory" class="history-import"><label for="importHash">Studionet transaction hash</label><div><input id="importHash" type="text" placeholder="0x… 64 hex characters" spellcheck="false" autocomplete="off" required><button class="primary" type="submit">Track hash ↗</button></div></form>'+
 '<p id="historyFeedback" class="history-feedback" role="status"></p></section>'+
 '<p class="history-note">Independent service case evidence: <a href="https://github.com/bearbaba/REPUTRAIL/blob/main/docs/ONCHAIN_EVIDENCE.md" rel="noopener" target="_blank">On-chain evidence ↗</a>. For older transactions not in this browser, search the public <a href="https://explorer-studio.genlayer.com/txs" rel="noopener" target="_blank">GenLayer Explorer ↗</a>.</p></section>'+
  '</main><aside class="activity" id="txPanel" role="status" aria-live="polite" hidden><div class="activity-kicker"><span class="live-pulse"></span> LIVE TRANSACTION <button type="button" id="txClose" aria-label="Close transaction notification">×</button></div>'+
 '<div class="tx-state-line"><span id="txSpinner" class="tx-spinner" hidden></span><h2 id="txTitle" class="txState">Waiting for wallet</h2></div><p id="txInfo" class="txInfo">No transaction signed yet.</p>'+
 '<div class="txHashLabel" id="txHashLabel" hidden>TRANSACTION HASH</div><div id="txHash" class="txHash" hidden></div>'+
 '<a id="txLink" rel="noopener" target="_blank" hidden>View on Explorer ↗</a>'+
 '<button id="retry" type="button" hidden>Recheck transaction</button><button id="openHistory" type="button" class="tx-history-shortcut">Transactions ↗</button><div id="walletIdentity" class="walletIdentity" hidden></div></aside></div></div></div>';
 bind();
}
let chosenAction='open_job',txDismiss=null,txToken=0;
const ACTION_LABELS={open_job:'Open job',submit_delivery:'Submit delivery',open_dispute:'Open dispute',adjudicate:'AI adjudication',accept_delivery:'Accept delivery',record_outcome:'Record outcome'};
const actionLabel=m=>ACTION_LABELS[m]||m.replaceAll('_',' ');
function workspaceMessage(message,error=false){
 const target=$('caseMessage');if(!target)return;
 target.textContent=String(message);target.hidden=false;
 target.className='case-message'+(error?' error':'');
}
function clearWorkspaceMessage(){const target=$('caseMessage');if(target){target.textContent='';target.hidden=true}}
function dismissTx(){if(txDismiss)clearTimeout(txDismiss);txDismiss=null;txToken++;$('txPanel').hidden=true}
function notice(title,info,phase=0,hash='',state='pending'){
 if(txDismiss)clearTimeout(txDismiss);
 txDismiss=null;const token=++txToken;
 $('txPanel').hidden=false;$('txPanel').dataset.txState=state;
 $('txTitle').textContent=title;$('txInfo').textContent=info;
 $('txSpinner').hidden=state!=='pending';
 $('txHash').hidden=!hash;$('txHashLabel').hidden=!hash;
 if(hash)$('txHash').textContent=hash;
 $('txLink').hidden=!hash;if(hash)$('txLink').href=txPrefix+encodeURIComponent(hash);
 if(['success','error','cancelled'].includes(state))txDismiss=setTimeout(()=>{
  if(txToken===token&&!checking&&!loadPending())dismissTx()
 },9000);
}
function pickCase(method){
 if(!project.forms.some(f=>f.method===method))return;
 chosenAction=method;
 for(const tab of document.querySelectorAll('[data-case-tab]')){
  const on=tab.dataset.caseTab===method;
  tab.classList.toggle('active',on);tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;
 }
 for(const panel of document.querySelectorAll('[data-case-panel]'))panel.hidden=panel.dataset.casePanel!==method;
 $('caseMode').textContent=actionLabel(method).toUpperCase();
 clearWorkspaceMessage();
}
function displayAccount(){
 const connected=Boolean(account);
 $('caseGate').hidden=connected;$('caseConsole').hidden=!connected;
 if(connected)$('caseSigner').textContent='CONNECTED OPERATOR  /  '+account+'  /  STUDIONET 61999';
}
function showPage(page){
 const id=['overview','workflow','explorer','transactions'].includes(page)?page:'overview';
 for(const p of ['overview','workflow','explorer','transactions'])$(p).hidden=p!==id;
 for(const b of document.querySelectorAll('[data-page]'))b.classList.toggle('active',b.dataset.page===id);
 $('breadcrumb').textContent=id[0].toUpperCase()+id.slice(1);
 if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
 if(id==='transactions')renderHistory();
}
function setBusy(value){
 busy=value;
 for(const b of document.querySelectorAll('[data-sign]'))b.disabled=value||!config?.configured;
}
function bind(){
 for(const b of document.querySelectorAll('[data-page]'))b.onclick=()=>showPage(b.dataset.page);
 window.addEventListener('hashchange',()=>showPage(location.hash.slice(1)));
 $('wallet').onclick=()=>connect().catch(e=>workspaceMessage('Wallet not connected: '+e.message,true));
 $('caseConnect').onclick=()=>connect().catch(e=>workspaceMessage('Wallet not connected: '+e.message,true));
 $('txClose').onclick=dismissTx;
 $('openHistory').onclick=()=>showPage('transactions');
 $('refreshHistory').onclick=()=>void refreshHistoryStatuses();
 $('importHistory').onsubmit=e=>{e.preventDefault();const hash=$('importHash').value.trim();
  if(!HASH_RE.test(hash)){$('historyFeedback').textContent='Enter a valid 0x-prefixed 64-digit transaction hash.';return}
  rememberTx(txStorage(),{hash,method:'unknown',status:'pending'});$('importHash').value='';renderHistory();void checkHistoryHash(hash);
 };
 $('txHistoryList').onclick=e=>{const button=e.target.closest('button[data-history-hash]');if(button)void checkHistoryHash(button.dataset.historyHash)};
 for(const b of document.querySelectorAll('[data-case-tab]'))b.onclick=()=>pickCase(b.dataset.caseTab);
 for(const action of project.forms){
  const f=document.querySelector('form[data-form="'+action.method+'"]');
  f.onsubmit=e=>{e.preventDefault();write(action).catch(err=>{setBusy(false);if(!$('txPanel').hidden)notice('Transaction not submitted',String(err.message||err),0,'','error');else workspaceMessage(String(err.message||err),true)})};
 }
 for(const button of document.querySelectorAll('[data-fill]'))button.onclick=()=>{
  const m=button.dataset.fill,a=project.forms.find(x=>x.method===m),data=project.presets[a.preset]||{};
  for(const [key,val] of Object.entries(data)){
   const field=$('f_'+m+'_'+key);if(field)field.value=String(val);
  }
  workspaceMessage('Example loaded. Review the fields; nothing was signed.');
 };
 for(const button of document.querySelectorAll('[data-digest]'))button.onclick=async()=>{
  try{const m=button.dataset.digest,a=project.forms.find(x=>x.method===m);
   const text=$('f_'+m+'_'+a.hashSource).value.trim();
   if(!text)throw Error('Enter the exact evidence or delivery content first');
   const field=a.fields.find(x=>x[2]==='hash');
   $('f_'+m+'_'+field[0]).value=await sha256(text);
   workspaceMessage('SHA-256 computed locally from the exact text. Nothing was signed.');
  }catch(e){workspaceMessage('SHA-256 failed: '+e.message,true)}
 };
 $('readForm').onsubmit=e=>{e.preventDefault();runRead()};
 $('readMethod').onchange=updateReadFields;
 $('retry').onclick=()=>{const p=loadPending();if(p)follow(p)};
 window.ethereum?.on?.('accountsChanged',a=>setAccount(a?.[0]||''));
 window.ethereum?.on?.('chainChanged',()=>workspaceMessage('Select GenLayer Studionet (61999) before signing.',true));
 showPage(location.hash.slice(1)||'overview');
 pickCase(chosenAction);displayAccount();
 updateReadFields();
 const pending=loadPending();
 if(pending?.hash){rememberWrite(pending);$('retry').hidden=false;notice(actionLabel(pending.method)+' pending','Recheck this saved transaction before signing again.',0,pending.hash)}
}
function updateReadFields(){
 const r=project.reads[Number($('readMethod').value)];
 $('readId').parentElement.hidden=!r[3].includes('id');
 $('readActor').parentElement.hidden=!r[3].includes('address');
}

function renderHistory(){
 const items=readHistory(txStorage());
 $('txCount').textContent=String(items.length);
 $('txHistoryList').innerHTML=items.map((tx,i)=>{
  const when=Number.isFinite(tx.savedAt)?new Date(tx.savedAt).toLocaleString():'Time unavailable';
  return '<article class="history-entry"><div class="history-top"><span class="history-seq">'+String(i+1).padStart(2,'0')+'</span><div><strong>'+esc(tx.method==='unknown'?'Tracked transaction':actionLabel(tx.method))+'</strong><small>'+esc(when)+' · Studionet 61999</small></div>'+
   '<span class="history-status">'+esc(displayStatus(tx.status))+'</span></div><code>'+esc(tx.hash)+'</code>'+
   (tx.actor?'<p>Signer: '+esc(tx.actor)+'</p>':'')+
   '<div class="history-actions"><a href="'+txPrefix+encodeURIComponent(tx.hash)+'" target="_blank" rel="noopener">Explorer receipt ↗</a>'+
   '<button type="button" data-history-hash="'+esc(tx.hash)+'">Recheck ↻</button></div></article>'
 }).join('')||'<p class="history-empty">No transactions saved in this browser yet. New signed calls will be added automatically; existing public hashes can be imported below.</p>';
}
async function checkHistoryHash(hash){
 if(!HASH_RE.test(hash))return;
 $('historyFeedback').textContent='Checking '+hash.slice(0,12)+'…';
 $('refreshHistory').disabled=true;
 try{
  const response=await fetch('/api/tx?hash='+encodeURIComponent(hash),{cache:'no-store'});
  const result=await response.json();
  if(!response.ok||!result.ok)throw Error(result.error||'Transaction lookup unavailable');
  const verdict=classifyTx(result);
  const pending=loadPending();
  if(verdict==='error'){
   updateTxStatus(txStorage(),hash,'error');
   if(pending?.hash?.toLowerCase()===hash.toLowerCase()){clearPending();$('retry').hidden=true}
  }else if(verdict==='success'){
   let verified=false;
   if(pending?.hash?.toLowerCase()===hash.toLowerCase()){
    try{verified=Boolean((await readProof(pending)).ok)}catch{}
    if(verified){clearPending();$('retry').hidden=true}
   }
   const old=readHistory(txStorage()).find(x=>x.hash===hash.toLowerCase());
   updateTxStatus(txStorage(),hash,(verified||old?.status==='verified')?'verified':'finalized-success');
  }else{
   const old=readHistory(txStorage()).find(x=>x.hash===hash.toLowerCase());
   if(!old||['pending','state-unverified'].includes(old.status))
    updateTxStatus(txStorage(),hash,'pending');
  }
  const latest=readHistory(txStorage()).find(x=>x.hash===hash.toLowerCase());
  $('historyFeedback').textContent=latest?('Chain status: '+displayStatus(latest.status)+
   '. An imported hash is execution-checked; exact stored-state verification requires the original signed action context.'):
    'Transaction status unavailable';
 }catch(error){$('historyFeedback').textContent='Lookup failed: '+String(error.message||error)}
 finally{$('refreshHistory').disabled=false;renderHistory()}
}
async function refreshHistoryStatuses(){
 const items=readHistory(txStorage()).slice(0,12);
 if(!items.length){$('historyFeedback').textContent='No saved hashes to check.';return}
 for(const item of items)await checkHistoryHash(item.hash);
}
function rememberWrite(rec,status='pending'){
 rememberTx(txStorage(),{hash:rec.hash,method:rec.method,actor:rec.actor,status});
 if(!$('transactions').hidden)renderHistory();
}
async function api(scope,method,args=[]){
 const url=new URL('/api/state',location.origin);
 url.searchParams.set('scope',scope);url.searchParams.set('method',method);
 args.forEach((v,i)=>url.searchParams.set('a'+i,String(v)));
 const resp=await fetch(url,{cache:'no-store'});
 let json;try{json=await resp.json()}catch{throw Error('Read API unavailable. Deploy on Vercel or configure dev server API.')}
 if(!resp.ok||!json.ok)throw Error(json.error||'Read failed');
 return parseValue(json.value);
}
async function runRead(){
 try{
  if(!config?.configured)throw Error('Two deployed contracts must be configured for on-chain reads');
  const r=project.reads[Number($('readMethod').value)];
  const args=r[3].map(type=>type==='address'?$('readActor').value.trim():positive($('readId').value));
  for(const v of args)if(typeof v==='string'&&!ADDRESS.test(v))throw Error('Invalid address');
  $('readResult').textContent='Reading GenLayer LATEST_FINAL…';
  const value=await api(r[1],r[2],args);
  $('readResult').textContent=JSON.stringify({network:61999,scope:r[1],method:r[2],args,
   finality:'LATEST_FINAL',value},null,2);
 }catch(e){$('readResult').textContent='Read failed: '+e.message}
}
function setAccount(a){
 account=ADDRESS.test(a||'')?a:'';
 $('wallet').textContent=account?short(account)+' · Switch':'Connect wallet';
 $('walletIdentity').textContent=account?'Active signer: '+account:'No wallet selected.';
 displayAccount();
}
async function connect(){
 if(!window.ethereum)throw Error('Install a wallet extension with EIP-1193 support');
 if(account){
  try{await window.ethereum.request({method:'wallet_requestPermissions',params:[{eth_accounts:{}}]})}
  catch(e){if(e?.code===4001)throw Error('Account selection rejected')}
 }
 const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
 if(!ADDRESS.test(accounts?.[0]||''))throw Error('No valid wallet selected');
 setAccount(accounts[0]);
}
async function ensureWallet(){
 if(!account)await connect();
 let id=await window.ethereum.request({method:'eth_chainId'});
 if(parseInt(id,16)!==CHAIN){
  const hex='0x'+CHAIN.toString(16);
  try{await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:hex}]})}
  catch(e){
   if(e?.code!==4902)throw Error('Switch to GenLayer Studionet 61999');
   await window.ethereum.request({method:'wallet_addEthereumChain',params:[{
    chainId:hex,chainName:'GenLayer Studionet',rpcUrls:['https://studio.genlayer.com/api'],
    nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18},
    blockExplorerUrls:['https://explorer-studio.genlayer.com']}]});
  }
 }
 id=await window.ethereum.request({method:'eth_chainId'});
 if(parseInt(id,16)!==CHAIN)throw Error('Wrong network');
 const selected=await window.ethereum.request({method:'eth_accounts'});
 if(!same(selected?.[0],account))throw Error('Active wallet changed. Connect again.');
 return createClient({chain:studionet,account,provider:window.ethereum});
}
function positive(s){if(!/^[1-9][0-9]*$/.test(String(s))||!Number.isSafeInteger(Number(s)))throw Error('Positive integer ID required');return Number(s)}
async function sha256(text){
 const out=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return Array.from(new Uint8Array(out),x=>x.toString(16).padStart(2,'0')).join('');
}
async function precheck(record){
 const m=record.method,a=record.args,actor=record.actor;
 if(m==='submit_evidence'){
  const c=await api('first','get_challenge',[a[0]]);
  if(!c.active||same(c.issuer,actor))throw Error('Applicant must differ from issuer and challenge must be active');
  const old=await api('first','attempt_for',[a[0],actor]);
  if(old)throw Error('Applicant already attempted this challenge');
 }else if(m==='assess_attempt'){
  const attempt=await api('first','get_attempt',[a[0]]);
  const challenge=await api('first','get_challenge',[attempt.challenge_id]);
  if(!same(challenge.issuer,actor)||attempt.status!=='SUBMITTED')throw Error('Use the issuer wallet on a pending attempt');
 }else if(m==='issue_credential'){
  const perm=await api('first','credential_permission',[a[0],actor]);
  if(perm.allowed!==true||!same(perm.applicant,actor))throw Error('Not authorized: requires a current PASS for this applicant');
 }else if(m==='revoke_credential'){
  const c=await api('second','get_credential',[a[0]]);
  if(!same(c.issuer,actor)||c.status!=='VALID')throw Error('Only issuer may revoke a valid credential');
 }else if(m==='close_challenge'){
  const c=await api('first','get_challenge',[a[0]]);
  if(!same(c.issuer,actor)||!c.active)throw Error('Issuer only; challenge must be active');
 }else if(m==='open_job'){
  if(same(actor,a[0]))throw Error('Client and agent wallets must be distinct');
 }else if(['submit_delivery','open_dispute','accept_delivery','adjudicate'].includes(m)){
  const j=await api('first','get_job',[a[0]]);
  if(m==='submit_delivery'&&(!same(j.agent,actor)||j.stage!=='OPEN'))
   throw Error('Assigned agent only, before delivery closes');
  if(['open_dispute','accept_delivery'].includes(m)&&(!same(j.client,actor)||j.stage!=='DELIVERED'))
   throw Error('Client only; job must be delivered but not decided');
  if(m==='adjudicate'&&(j.stage!=='DISPUTED'||j.verdict!=='PENDING')){
   if(j.stage==='DECIDED')
    throw Error('Job #'+a[0]+' is already adjudicated: '+j.verdict+'. Select Record eligible reputation event to continue.');
   throw Error('Job #'+a[0]+' is '+j.stage+' / '+j.verdict+'. Only a pending dispute can be adjudicated.');
  }
 }else if(m==='record_outcome'){
  const [perm,old]=await Promise.all([api('first','reputation_permission',[a[0]]),api('second','outcome_for',[a[0]])]);
  if(perm.allowed!==true||old)throw Error('Only a final eligible unrecorded outcome can enter the ledger');
 }
}
const countNames={create_challenge:['first','challenges'],submit_evidence:['first','attempts'],
 issue_credential:['second','credentials'],open_job:['first','jobs'],record_outcome:['second','outcomes']};
function argsOf(a){
 return a.fields.map(([key,,kind])=>{
  const input=$('f_'+a.method+'_'+key),v=input.value;
  if(!v.trim())throw Error('Missing '+key);
  if(kind==='number')return positive(v.trim());
  if(kind==='address'&&!ADDRESS.test(v.trim()))throw Error('Invalid wallet address');
  if(kind==='hash'&&!/^[a-f0-9]{64}$/.test(v.trim()))throw Error('Expected lowercase SHA-256');
  return v.trim();
 });
}
function pending(){try{return JSON.parse(sessionStorage.getItem(pendingKey)||'null')}catch{return null}}
function loadPending(){return pending()}
function savePending(r){sessionStorage.setItem(pendingKey,JSON.stringify(r))}
function clearPending(){sessionStorage.removeItem(pendingKey)}
async function write(action){
 if(busy)return;
 if(!config?.configured)throw Error('Deploy both contracts and configure the addresses before signing');
 const old=loadPending();
 if(old){$('retry').hidden=false;notice(actionLabel(old.method)+' pending','Recheck the saved hash before signing again.',0,old.hash);return}
 setBusy(true);
 try{
  const args=argsOf(action);
  if(action.hashSource){
   const field=action.fields.findIndex(f=>f[0]===action.hashSource);
   const hashIndex=action.fields.findIndex(f=>f[2]==='hash');
   if(args[hashIndex]!==await sha256(args[field]))throw Error('SHA-256 does not match the exact submitted content');
  }
  const client=await ensureWallet();
  const rec={scope:action.scope,method:action.method,args,actor:account.toLowerCase(),hash:'',prior:null};
  await precheck(rec);
  const counters=countNames[action.method];
  if(counters){
   const stat=await api(counters[0],'stats');
   rec.prior=stat[counters[1]];
   if(!Number.isSafeInteger(rec.prior))throw Error('Cannot verify pre-write count');
  }
  notice('Confirm '+actionLabel(action.method),'Review the transaction in your wallet. No automatic retries.',0,'','pending');
  const hash=await client.writeContract({address:config[action.scope],functionName:action.method,args,value:0n});
  if(!/^0x[a-f0-9]{64}$/i.test(hash||''))throw Error('Wallet did not return valid transaction hash');
  rec.hash=hash;savePending(rec);rememberWrite(rec);$('retry').hidden=false;
  notice(actionLabel(action.method)+' submitted','Signed request sent. Waiting for GenLayer finality.',0,hash,'pending');
  setBusy(false);await follow(rec);
 }finally{setBusy(false)}
}
async function readProof(rec){
 const m=rec.method,a=rec.args;
 let value;
 if(m==='create_challenge')value=await api('first','get_challenge',[(await api('first','stats')).challenges]);
 else if(m==='submit_evidence')value=await api('first','get_attempt',[(await api('first','stats')).attempts]);
 else if(m==='assess_attempt')value=await api('first','get_attempt',[a[0]]);
 else if(m==='issue_credential')value=await api('second','get_credential',[(await api('second','stats')).credentials]);
 else if(m==='revoke_credential')value=await api('second','get_credential',[a[0]]);
 else if(m==='close_challenge')value=await api('first','get_challenge',[a[0]]);
 else if(m==='open_job')value=await api('first','get_job',[(await api('first','stats')).jobs]);
 else if(['submit_delivery','accept_delivery','open_dispute','adjudicate'].includes(m))value=await api('first','get_job',[a[0]]);
 else if(m==='record_outcome')value=await api('second','outcome_for',[a[0]]);
 return {ok:verifyStored(rec,value),value};
}
async function follow(rec){
 if(checking)return;
 checking=true;setBusy(true);
 notice(actionLabel(rec.method)+' processing','GenLayer is finalizing this operation. Do not sign it again.',0,rec.hash,'pending');
 try{
  for(let i=0;i<55;i++){
   let tx;
   try{
    const resp=await fetch('/api/tx?hash='+encodeURIComponent(rec.hash),{cache:'no-store'});
    tx=await resp.json();
    if(!resp.ok||!tx.ok)throw Error(tx.error||'Transaction fetch failed');
   }catch{await new Promise(r=>setTimeout(r,3200));continue}
   const state=classifyTx(tx);
   if(state==='error'){
    rememberWrite(rec,'error');clearPending();$('retry').hidden=true;
    notice(actionLabel(rec.method)+' rejected','GenVM finalized with an error. No successful state change is claimed.',0,rec.hash,'error');
    return;
   }
   if(state==='success'){
    notice(actionLabel(rec.method)+' finalized','GenVM SUCCESS. Confirming the exact stored record…',0,rec.hash,'pending');
    for(let n=0;n<9;n++){
     try{
      const proof=await readProof(rec);
      if(proof.ok){
       rememberWrite(rec,'verified');clearPending();$('retry').hidden=true;
       const result=rec.method==='adjudicate'?('Verdict: '+String(proof.value?.verdict||'FINALIZED')):(Number.isSafeInteger(proof.value?.id)?('Record #'+proof.value.id+' saved'):'On-chain state verified');
       notice(actionLabel(rec.method)+' successful',result+' · Confirmed against LATEST_FINAL.',0,rec.hash,'success');
       return;
      }
     }catch{}
     await new Promise(r=>setTimeout(r,2500));
    }
    rememberWrite(rec,'state-unverified');
    notice(actionLabel(rec.method)+' needs readback','GenVM SUCCESS, but a matching stored record could not be confirmed yet. Recheck before signing again.',0,rec.hash,'warning');
    return;
   }
   await new Promise(r=>setTimeout(r,3200));
  }
  rememberWrite(rec,'pending');
  notice(actionLabel(rec.method)+' still pending','Transaction retained. Recheck the existing hash; do not submit another signature.',0,rec.hash,'warning');
 }finally{checking=false;setBusy(false)}
}
async function init(){
 render();
 try{
  const response=await fetch('/api/state?op=config',{cache:'no-store'});
  const json=await response.json();
  if(!response.ok||!json.ok)throw Error('Configuration endpoint unavailable');
  config=json;
  if(json.configured){try{const [jobs,outcomes]=await Promise.all([api('first','stats'),api('second','stats')]);
   if(Number.isSafeInteger(jobs.jobs))$('liveJobs').textContent=String(jobs.jobs);
   if(Number.isSafeInteger(outcomes.outcomes))$('liveOutcomes').textContent=String(outcomes.outcomes);
  }catch{ /* Leave metrics unknown if read unavailable. */ }}
  $('deployState').textContent=json.configured?'ONLINE':'NOT DEPLOYED';
  $('network').textContent=json.configured?'Studionet · addresses configured':'Studionet · deployment required';
  $('workflowNotice').textContent=json.configured?
   'Two contract addresses are configured. Verify deployed source and constructor binding before signing.':
   'Contracts are not deployed/configured in this environment. Signing is disabled.';
  $('workflowNotice').className=json.configured?'notice':'notice warning';
 }catch{
  config={configured:false};
  $('deployState').textContent='NOT DEPLOYED';
  $('network').textContent='API unavailable';
  $('workflowNotice').textContent='No serverless configuration available. Deploy contracts and API before signing.';
 }
 setBusy(false);
 try{const a=await window.ethereum?.request?.({method:'eth_accounts'});if(ADDRESS.test(a?.[0]||''))setAccount(a[0]);}catch{}
 const p=loadPending();if(p?.hash&&config?.configured)void follow(p);
}
init();
