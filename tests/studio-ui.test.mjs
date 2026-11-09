import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

const ui=readFileSync('src/main.js','utf8');
const css=readFileSync('src/style.css','utf8');

test('contract action selectors show one method per panel',()=>{
 assert.match(ui,/role="tablist" aria-label="Case operations"/);
 assert.match(ui,/role="tabpanel" hidden/);
 assert.match(ui,/function pickCase\(method\)/);
 assert.match(ui,/panel\.hidden=panel\.dataset\.casePanel!==method/);
 assert.doesNotMatch(ui,/project\.forms\.slice\(0,2\)\.map\(formHTML\)/);
});
test('wallet-gated operator console and independent read-only terminal',()=>{
 assert.match(ui,/id="caseGate"/);
 assert.match(ui,/id="caseConsole" class="case-console" hidden/);
 assert.match(ui,/caseGate'\)\.hidden=connected/);
 assert.match(ui,/caseConsole'\)\.hidden=!connected/);
 assert.match(ui,/id="readForm"/);
});
test('transaction status is contextual and independent from example loading',()=>{
 assert.match(ui,/id="txPanel" role="status" aria-live="polite" hidden/);
 assert.match(css,/\.activity\[hidden\]\{display:none!important\}/);
 assert.match(ui,/workspaceMessage\('Example loaded/);
 assert.match(ui,/workspaceMessage\('SHA-256 computed/);
 assert.match(ui,/notice\('Confirm '\+actionLabel\(action\.method\)/);
 assert.doesNotMatch(ui,/id="phase1"/);
});
test('static DOM references have mount points',()=>{
 const all=ui+readFileSync('index.html','utf8');
 const ids=[...new Set([...ui.matchAll(/\$\('([A-Za-z][\w-]*)'\)/g)].map(m=>m[1]))];
 for(const id of ids)assert.ok(all.includes('id="'+id+'"'),'missing element: #'+id);
});
