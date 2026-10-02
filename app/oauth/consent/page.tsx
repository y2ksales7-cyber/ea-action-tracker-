import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAccount } from '@/lib/workspaces';
import { ConsentForm } from '@/components/mcp-forms';
export const dynamic='force-dynamic';
export default async function Consent({searchParams}:{searchParams:Promise<{authorization_id?:string}>}) {
 const {authorization_id:id}=await searchParams;
 const db=await createClient(); const {data:{user}}=await db.auth.getUser();
 if(!id || id.length>200) return <main className="auth-shell"><section className="panel"><h1>Start the connection from your MCP client</h1><a href="/integrations">Connection instructions</a></section></main>;
 if(!user) redirect('/login?next='+encodeURIComponent('/oauth/consent?authorization_id='+encodeURIComponent(id)));
 const {workspaces}=await getAccount(); const {data,error}=await db.auth.oauth.getAuthorizationDetails(id);
 if(error || !data) return <main className="auth-shell"><section className="panel"><h1>Connection request unavailable</h1><p>Restart this connection from your MCP client. Supabase OAuth must be enabled by the administrator.</p></section></main>;
 if('redirect_url' in data) redirect(data.redirect_url);
 return <main className="auth-shell"><section className="panel auth-panel"><p className="eyebrow">ACTION TRACKER CONNECTION</p><h1>Allow {data.client.name || 'this MCP client'} to read your actions?</h1><p>Only the workspace you select and your permitted departments are accessible. The client can retrieve meetings and actions and draft reminders. It cannot edit actions, delete records, manage teammates or send emails.</p><p className="muted">Requested identity scopes: {data.scope}. Callback: {data.redirect_uri}. You can revoke this connection in Integrations.</p><ConsentForm authorizationId={id} workspaces={workspaces}/></section></main>;
}
