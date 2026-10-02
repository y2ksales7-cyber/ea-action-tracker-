import Link from 'next/link';
import type { Department, Item, Meeting } from '@/lib/data';
import { deadlineFlag, formatDate } from '@/lib/ranking';
import { ItemForm, DeleteForm, StatusForm } from './forms';
export function ItemCard({ item, department, meeting, date, editable = false }: { item: Item; department?: Department; meeting?: Meeting; date: string; editable?: boolean }) {
  const flag = deadlineFlag(item, date);
  return <article className={`item-card ${flag}`} data-item-id={item.id}>
    <div className="card-top"><span className={`priority ${item.priority.toLowerCase()}`}>{item.priority} priority</span><span className="department-tag">{department?.name}</span></div>
    <h3>{item.description}</h3><p className="assignee"><span aria-hidden="true">◎</span> {item.assignee} <span className="status-chip">{item.status}</span></p>
    <div className="deadline"><span>{formatDate(item.deadline)}</span>{flag === 'overdue' ? <strong>Overdue</strong> : flag === 'soon' ? <strong>Due this week</strong> : item.status === 'Done' ? <strong className="completed">Completed</strong> : null}</div>
    {meeting && <Link className="meeting-source" href={`/meetings/${meeting.id}`}>{meeting.topic} ↗</Link>}
    {item.notes && <p className="item-notes">{item.notes}</p>}
    <details className="card-details"><summary>Update status & notes</summary><StatusForm key={item.status + item.notes} item={item} /></details>
    {editable && meeting && <><details className="card-details"><summary>Edit action item</summary><ItemForm key={JSON.stringify(item)} meeting={meeting} item={item} /></details><DeleteForm id={item.id} kind="item" /></>}
  </article>;
}
