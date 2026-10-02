'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAccount } from '@/lib/workspaces';
import type { FormState } from '@/lib/actions';
export async function decideConnection(_: FormState,form: FormData): Promise<FormState> {
  let destination='';
  try {
    const {user,workspaces}=await getAccount();
    const db=await createClient();
    const authorizationId=String(form.get('authorization_id'));
    const {data:details,error}=await db.auth.oauth.getAuthorizationDetails(authorizationId);
    if(error || !details) throw new Error('This connection request expired. Restart it from your MCP client.');
    if('redirect_url' in details) destination=details.redirect_url;
    else if(form.get('decision')==='deny') {
      const {data,error}=await db.auth.oauth.denyAuthorization(authorizationId,{skipBrowserRedirect:true});
      if(error || !data) throw new Error('Could not decline the request.'); destination=data.redirect_url;
    } else {
      if(form.get('decision')!=='approve') throw new Error('Choose Allow or Deny.');
      const workspaceId=String(form.get('workspace_id'));
      if(!workspaces.some(w=>w.id===workspaceId)) throw new Error('Select a workspace you belong to.');
      if(details.scope.split(' ').filter(Boolean).some(s=>!['openid','profile','email'].includes(s))) throw new Error('This client requests unsupported scopes.');
      const {error:saveError}=await db.from('mcp_connections').upsert({user_id:user.id,client_id:details.client.id,client_name:details.client.name||'MCP client',workspace_id:workspaceId},{onConflict:'user_id,client_id'});
      if(saveError) throw new Error('Could not save connection permissions. Ask the administrator to apply the integration migration.');
      const {data,error}=await db.auth.oauth.approveAuthorization(authorizationId,{skipBrowserRedirect:true});
      if(error || !data) {
        await db.from('mcp_connections').delete().eq('user_id',user.id).eq('client_id',details.client.id);
        throw new Error('Could not approve this request. Please restart the connection.');
      }
      destination=data.redirect_url;
    }
  } catch(e) {return {error:e instanceof Error?e.message:'Connection failed.'};}
  redirect(destination);
}
export async function revokeConnection(_: FormState,form: FormData): Promise<FormState> {
  const {user}=await getAccount();
  const db=await createClient(); const clientId=String(form.get('client_id'));
  const {error}=await db.from('mcp_connections').delete().eq('user_id',user.id).eq('client_id',clientId);
  if(error) return {error:'Could not revoke the connection. Retry.'};
  await db.auth.oauth.revokeGrant({clientId});
  revalidatePath('/integrations'); return {success:'Access revoked. This connection can no longer retrieve your actions.'};
}
