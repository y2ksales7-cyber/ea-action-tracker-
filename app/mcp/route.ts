import { createClient } from '@supabase/supabase-js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { trackerServer } from '@/lib/mcp/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const resource='https://ea-action-tracker.vercel.app/mcp';
function unauthorized() {
  return Response.json({error:'Sign in and approve the Action Tracker connection.'},{status:401,headers:{'WWW-Authenticate':`Bearer resource_metadata="https://ea-action-tracker.vercel.app/.well-known/oauth-protected-resource", scope="openid"`,'Cache-Control':'no-store'}});
}
export async function POST(request: Request) {
  const origin=request.headers.get('origin');
  const allowed=['https://ea-action-tracker.vercel.app','https://chatgpt.com','https://claude.ai',...(process.env.NODE_ENV==='development'?['http://localhost:3000']:[])];
  if(origin && !allowed.includes(origin)) return Response.json({error:'Invalid origin'},{status:403});
  const token=request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if(!token || token.length>10000) return unauthorized();
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:verified,error}=await db.auth.getClaims(token);
  const claims=verified?.claims;
  // Signature, expiry, issuer and audience must all validate before using RLS.
  if(error || !claims || claims.iss!==`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1` || !Array.isArray(claims.aud) || !claims.aud.includes(resource) || !claims.client_id || claims.role!=='authenticated') return unauthorized();
  const {data:connection,error:connectionError}=await db.from('mcp_connections').select('workspace_id').eq('user_id',claims.sub).eq('client_id',String(claims.client_id)).maybeSingle();
  if(connectionError || !connection) return unauthorized();
  const {data:member}=await db.from('workspace_members').select('workspace_id').eq('workspace_id',connection.workspace_id).eq('user_id',claims.sub).maybeSingle();
  if(!member) return unauthorized();
  if(Number(request.headers.get('content-length')??0)>65536) return Response.json({error:'Request too large'},{status:413});
  const text=await request.text();
  if(text.length>65536) return Response.json({error:'Request too large'},{status:413});
  let body: unknown; try {body=JSON.parse(text);} catch {return Response.json({error:'Invalid JSON'},{status:400});}
  const server=trackerServer(db,connection.workspace_id);
  const transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
  await server.connect(transport);
  try {
    const response=await transport.handleRequest(request,{parsedBody:body});
    response.headers.set('Cache-Control','no-store'); return response;
  } finally {await server.close();}
}
export async function GET(request: Request) {
  return request.headers.has('authorization') ? new Response(null,{status:405,headers:{Allow:'POST'}}) : unauthorized();
}
export async function DELETE() {return new Response(null,{status:405,headers:{Allow:'POST'}});}
