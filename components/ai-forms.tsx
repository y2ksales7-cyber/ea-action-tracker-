'use client';
import { useActionState, useState } from 'react';
import { extractActions, saveDrafts, composeReminder } from '@/lib/ai/actions';
import type { ActionDraft } from '@/lib/ai/validation';
export function ExtractionForm({meetingId,enabled}:{meetingId:string;enabled:boolean}) {
  const [extracted,extract,pending] = useActionState(extractActions,{});

  const [revision,setRevision] = useState(0);
  return <section className="panel"><h2>Turn meeting notes into actions</h2><p className="muted">Drafts stay unsaved until you review them. Submitted notes go to OpenRouter and its model provider.</p>{!enabled && <p className="field-hint">AI setup is pending. You can still add actions manually.</p>}
    <form action={extract} className="form-grid" onSubmit={() => setRevision(v=>v+1)}><input type="hidden" name="meeting_id" value={meetingId}/><label className="full">Meeting notes<textarea name="meeting_notes" rows={6} maxLength={12000} required placeholder="Paste the commitments, owners and deadlines from this meeting…"/></label><div className="full"><button disabled={!enabled || pending}>{pending ? 'Extracting…' : 'Extract action drafts'}</button>{extracted.error && <p role="alert" className="form-error">{extracted.error}</p>}{extracted.success && <p role="status">{extracted.success}</p>}</div></form>
    { !pending && !!extracted.drafts?.length && <DraftReview key={revision} drafts={extracted.drafts} meetingId={meetingId}/> }
  </section>;
}
function DraftReview({drafts,meetingId}:{drafts:ActionDraft[];meetingId:string}) {
 const [saved,save,saving] = useActionState(saveDrafts,{});
 return <form action={save} className="ai-drafts"><input type="hidden" name="meeting_id" value={meetingId}/>{drafts.map((draft,i)=><fieldset key={i} disabled={saving || !!saved.success}><legend>Draft {i+1}</legend><label className="checkbox"><input type="checkbox" name="selected" value={i} defaultChecked/>Include this action</label><div className="form-grid"><label className="full">Description<textarea name={`description_${i}`} defaultValue={draft.description} maxLength={1000}/></label><label>Assignee<input name={`assignee_${i}`} defaultValue={draft.assignee} maxLength={200}/></label><label>Deadline<input name={`deadline_${i}`} type="date" defaultValue={draft.deadline}/></label><label>Priority<select name={`priority_${i}`} defaultValue={draft.priority}><option>High</option><option>Medium</option><option>Low</option></select></label></div></fieldset>)}{saved.error && <p role="alert" className="form-error">{saved.error}</p>}{saved.success && <p role="status" className="form-success">{saved.success}</p>}<button disabled={saving || !!saved.success}>{saving ? 'Saving…' : 'Save reviewed actions'}</button></form>;
}
export function ReminderForm({itemId}:{itemId:string}) {
  const [state,action,pending] = useActionState(composeReminder,{});
  return <details><summary>Draft a reminder</summary><p className="field-hint">The action description, assignee, deadline and status will be sent to OpenRouter. Nothing is emailed.</p><form action={action}><input type="hidden" name="item_id" value={itemId}/><button className="secondary" disabled={pending}>{pending ? 'Drafting…' : 'Generate reminder draft'}</button>{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.reminder && <label>Reminder draft<textarea rows={6} readOnly value={state.reminder} onFocus={e=>e.target.select()}/><small>Select the text to copy and share it yourself.</small></label>}</form></details>;
}


