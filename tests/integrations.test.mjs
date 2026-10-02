import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(path,overrides={}) {
 const output=ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',output)(id=>Object.hasOwn(overrides,id)?overrides[id]:id==='server-only'?{}:require(id),module,module.exports);
 return module.exports;
}
const ranking=load('lib/ranking.ts');
const validation=load('lib/ai/validation.ts');
const {trackerServer}=load('lib/mcp/server.ts',{'@/lib/ranking':ranking});
const {WebStandardStreamableHTTPServerTransport}=require('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js');
test('AI drafts reject invented schema values and invalid dates but allow missing details for review',()=>{
 assert.equal(validation.extractionSchema.safeParse({items:[{description:'Budget',assignee:'',deadline:'',priority:'High'}]}).success,true);
 assert.equal(validation.extractionSchema.safeParse({items:[{description:'Budget',assignee:'HOD',deadline:'2026-02-30',priority:'High'}]}).success,false);
 assert.equal(validation.extractionSchema.safeParse({items:[{description:'Budget',assignee:'HOD',deadline:'2026-10-04',priority:'Urgent'}]}).success,false);
});
const workspace='00000000-0000-4000-8000-000000000010';
const permitted=[{id:'00000000-0000-4000-8000-000000000011',description:'Budget',assignee:'Finance HOD',priority:'High',deadline:'2026-10-01',status:'Open',workspace_id:workspace}, {id:'00000000-0000-4000-8000-000000000012',description:'Archive',assignee:'Finance HOD',priority:'Low',deadline:'2026-11-01',status:'Open',workspace_id:workspace}];
function mockDb(){
 return {from:()=>{let rows=[...permitted];const query={select:()=>query,eq:(k,v)=>{rows=rows.filter(r=>r[k]===v);return query;},limit:n=>Promise.resolve({data:rows.slice(0,n),error:null}),maybeSingle:()=>Promise.resolve({data:rows[0]??null,error:null})};return query;}};
}
async function rpc(message){
 const server=trackerServer(mockDb(),workspace);
 const transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
 await server.connect(transport);
 const response=await transport.handleRequest(new Request('https://ea-action-tracker.vercel.app/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-06-18'},body:JSON.stringify({jsonrpc:'2.0',id:1,...message})}));
 const result=await response.json();await server.close();return result;
}
test('MCP initializes and exposes only four read-only tools',async()=>{
 const init=await rpc({method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'1'}}});
 assert.equal(init.result.serverInfo.name,'ea-action-tracker');
 const list=await rpc({method:'tools/list'});
 assert.equal(list.result.tools.length,4);
 assert.ok(list.result.tools.every(t=>t.annotations.readOnlyHint&&t.annotations.destructiveHint===false));
});
test('MCP ranks permitted actions, guessed IDs reveal no content, and reminder stays unsent',async()=>{
 const list=await rpc({method:'tools/call',params:{name:'list_action_items',arguments:{limit:10}}});
 assert.equal(JSON.parse(list.result.content[0].text).items[0].description,'Budget');
 const guessed=await rpc({method:'tools/call',params:{name:'get_action_item',arguments:{item_id:'00000000-0000-4000-8000-000000000099'}}});
 assert.equal(JSON.parse(guessed.result.content[0].text).item,null);
 const reminder=await rpc({method:'tools/call',params:{name:'compose_reminder',arguments:{item_id:permitted[0].id}}});
 assert.equal(JSON.parse(reminder.result.content[0].text).sent,false);
 const invalid=await rpc({method:'tools/call',params:{name:'list_action_items',arguments:{limit:100000}}});
 assert.ok(invalid.result?.isError || invalid.error);
});
test('MCP HTTP endpoint rejects missing, forged, wrong-audience tokens and untrusted origins',async()=>{
 const fakeClient={auth:{getClaims:async()=>({data:{claims:{iss:'https://invalid',aud:['authenticated'],role:'authenticated',sub:'x',client_id:'x'}}})}};
 const routes=load('app/mcp/route.ts',{'@/lib/mcp/server':{trackerServer},'@supabase/supabase-js':{createClient:()=>fakeClient}});
 const noToken=await routes.POST(new Request('https://ea-action-tracker.vercel.app/mcp',{method:'POST'}));
 assert.equal(noToken.status,401);assert.match(noToken.headers.get('www-authenticate'),/oauth-protected-resource/);
 const token=await routes.POST(new Request('https://ea-action-tracker.vercel.app/mcp',{method:'POST',headers:{Authorization:'Bearer forged'}}));assert.equal(token.status,401);
 const origin=await routes.POST(new Request('https://ea-action-tracker.vercel.app/mcp',{method:'POST',headers:{Origin:'https://attacker.example'}}));assert.equal(origin.status,403);
});
