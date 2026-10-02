import Link from 'next/link';
import type { Department, Item, Meeting } from '@/lib/data';
import { deadlineFlag, formatDate } from '@/lib/ranking';
import { ItemForm, DeleteForm, StatusForm } from './forms';
export function ItemCard({ item, department, meeting, date, editable = false }: { item: Item; department?: Department; meeting?: Meeting; date: string; editable?: boolean }) {
  const flag = deadlineFlag(item, date);
  const initials = item.assignee.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return <article className={`item-card ${flag}`} data-item-id={item.id}>
    <div className="card-top"><span className={`priority ${item.priority.toLowerCase()}`}><span className="priority-dot" aria-hidden="true" />{item.priority} priority</span>{department && <span className="department-tag">{department.name}</span>}</div>
    <h3>{item.description}</h3>
    <div className="card-owner"><p className="assignee"><span className="owner-avatar" aria-hidden="true">{initials}</span> {item.assignee}</p><span className={`status-chip ${item.status === 'Done' ? 'done' : item.status === 'In Progress' ? 'in-progress' : 'open'}`}>{item.status}</span></div>
    <div className="deadline"><span><span className="deadline-label">Due</span> {formatDate(item.deadline)}</span>{flag === 'overdue' ? <strong>Overdue</strong> : flag === 'soon' ? <strong>Due this week</strong> : item.status === 'Done' ? <strong className="completed">✓ Completed</strong> : null}</div>
    {meeting && <Link className="meeting-source" href={`/meetings/${meeting.id}`}>{meeting.topic} ↗</Link>}
    {item.notes && <p className="item-notes">{item.notes}</p>}
    {editable && <details className="card-details"><summary>Update status & notes</summary><StatusForm key={item.status + item.notes} item={item} /></details>}
    {editable && meeting && <><details className="card-details"><summary>Edit action item</summary><ItemForm key={JSON.stringify(item)} meeting={meeting} item={item} /></details><DeleteForm id={item.id} kind="item" /></>}
  </article>;
}
