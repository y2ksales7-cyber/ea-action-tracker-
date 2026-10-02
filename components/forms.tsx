'use client';
import { useActionState, useEffect, useRef } from 'react';
import { saveMeeting, deleteMeeting, saveItem, deleteItem, updateStatus, type FormState } from '@/lib/actions';
import type { Department, Meeting, Item } from '@/lib/data';
function Feedback({ state }: { state: FormState }) {
  return <>{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}</>;
}
export function MeetingForm({ departments, meeting, date }: { departments: Department[]; meeting?: Meeting; date: string }) {
  const [state, action, pending] = useActionState(saveMeeting, {});
  return <form action={action} className="form-grid">
    {meeting && <input type="hidden" name="id" value={meeting.id} />}
    <label>Department<select name="department_id" defaultValue={meeting?.department_id ?? ''} required disabled={!!meeting}><option value="" disabled>Select department</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    {meeting && <input type="hidden" name="department_id" value={meeting.department_id} />}
    <label>Meeting date<input type="date" name="date" defaultValue={meeting?.date ?? date} required /></label>
    <label className="full">Topic<input name="topic" placeholder="e.g. Q1 Budget Review" defaultValue={meeting?.topic} required maxLength={200} /></label>
    <label className="full">Attendees <span className="muted">(comma separated)</span><input name="attendees" placeholder="CEO, Finance HOD" defaultValue={meeting?.attendees?.join(', ')} maxLength={2000} /></label>
    <div className="full"><Feedback state={state} /><button disabled={pending || !departments.length}>{pending ? 'Saving…' : meeting ? 'Save meeting' : 'Create meeting'}</button></div>
  </form>;
}
export function ItemForm({ meeting, item }: { meeting: Meeting; item?: Item }) {
  const [state, action, pending] = useActionState(saveItem, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success && !item) form.current?.reset(); }, [state, item]);
  return <form ref={form} action={action} className="form-grid">
    <input type="hidden" name="meeting_id" value={meeting.id} />{item && <input type="hidden" name="id" value={item.id} />}
    <label className="full">Description<textarea name="description" placeholder="What needs to happen?" defaultValue={item?.description} required maxLength={1000} rows={2} /></label>
    <label>Assignee<input name="assignee" placeholder="e.g. Finance HOD" defaultValue={item?.assignee} required maxLength={200} /></label>
    <label>Deadline<input name="deadline" type="date" defaultValue={item?.deadline} required /></label>
    <label>Priority<select name="priority" defaultValue={item?.priority ?? 'Medium'}><option>High</option><option>Medium</option><option>Low</option></select></label>
    <label>Status<select name="status" defaultValue={item?.status ?? 'Open'}><option>Open</option><option>In Progress</option><option>Done</option></select></label>
    <label className="full">Notes<textarea name="notes" placeholder="Progress, blockers, or follow-up context" defaultValue={item?.notes ?? ''} maxLength={5000} rows={2} /></label>
    <div className="full"><Feedback state={state} /><button disabled={pending}>{pending ? 'Saving…' : item ? 'Save action item' : 'Add action item'}</button></div>
  </form>;
}
export function StatusForm({ item }: { item: Item }) {
  const [state, action, pending] = useActionState(updateStatus, {});
  return <form action={action} className="status-form"><input type="hidden" name="id" value={item.id} />
    <label>Status<select name="status" defaultValue={item.status}><option>Open</option><option>In Progress</option><option>Done</option></select></label>
    <label>Follow-up notes<textarea name="notes" defaultValue={item.notes ?? ''} rows={2} maxLength={5000} /></label>
    <Feedback state={state} /><button className="secondary" disabled={pending}>{pending ? 'Saving…' : 'Save status & notes'}</button>
  </form>;
}
export function DeleteForm({ id, kind }: { id: string; kind: 'meeting' | 'item' }) {
  const [state, action, pending] = useActionState(kind === 'meeting' ? deleteMeeting : deleteItem, {});
  return <details className="delete-panel"><summary>Delete {kind === 'meeting' ? 'meeting' : 'action item'}</summary><form action={action}><input type="hidden" name="id" value={id} />
    <label className="checkbox"><input type="checkbox" name="confirm" value="yes" required />{kind === 'meeting' ? 'Delete this meeting and all its action items permanently.' : 'Delete this action item permanently.'}</label>
    <Feedback state={state} /><button className="danger" disabled={pending}>{pending ? 'Deleting…' : 'Confirm delete'}</button>
  </form></details>;
}
