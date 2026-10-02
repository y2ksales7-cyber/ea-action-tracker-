'use client';
import { useActionState } from 'react';
import { decideConnection,revokeConnection } from '@/lib/mcp/actions';
export function ConsentForm({authorizationId,workspaces}:{authorizationId:string;workspaces:{id:string;name:string}[]}) {
 const [state,action,pending]=useActionState(decideConnection,{});
 return <form action={action}><input type="hidden" name="authorization_id" value={authorizationId}/><label>Workspace<select name="workspace_id" defaultValue={workspaces[0]?.id}>{workspaces.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>{state.error&&<p className="form-error" role="alert">{state.error}</p>}<div className="form-actions"><button name="decision" value="approve" disabled={pending||!workspaces.length}>{pending?'Please wait…':'Allow read access'}</button><button className="secondary" name="decision" value="deny" disabled={pending}>Deny</button></div></form>;
}
export function RevokeConnection({clientId}:{clientId:string}) {
 const [state,action,pending]=useActionState(revokeConnection,{});
 return <form action={action}><input type="hidden" name="client_id" value={clientId}/><button className="secondary" disabled={pending}>{pending?'Revoking…':'Revoke access'}</button>{state.error&&<p role="alert">{state.error}</p>}{state.success&&<p role="status">{state.success}</p>}</form>;
}
