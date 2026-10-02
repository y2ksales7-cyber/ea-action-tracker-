import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readWorkspace } from '@/lib/data';
import { rankItems, today, formatDate } from '@/lib/ranking';
import { MeetingForm, ItemForm, DeleteForm } from '@/components/forms';
import { ItemCard } from '@/components/item-card';
export const dynamic = 'force-dynamic';
export default async function MeetingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { departments, meetings, items, canWrite } = await readWorkspace();
  const meeting = meetings.find(m => m.id === id);
  if (!meeting) notFound();
  const department = departments.find(d => d.id === meeting.department_id);
  const actions = rankItems(items.filter(i => i.meeting_id === id));
  return <><Link className="back-link" href="/meetings">← All meetings</Link><div className="page-heading"><div><p className="eyebrow">{department?.name} / {formatDate(meeting.date)}</p><h1>{meeting.topic}</h1><p className="subtitle">{meeting.attendees?.join(' · ') || 'No attendees recorded'}</p></div>{canWrite && <a className="button" href="#add-item">+ Add action item</a>}</div>
    <div className="split-layout"><section className="panel"><h2>Action items <span className="count">{actions.length}</span></h2><div className="item-grid single">{actions.map(item => <ItemCard key={item.id} item={item} department={department} meeting={meeting} date={today()} editable={canWrite} />)}</div>{!actions.length && <p className="empty">No action items yet. Add the first commitment below.</p>}<Link className="text-link" href="/">View on ranked board →</Link></section>{canWrite && <div className="side-stack"><section className="panel" id="add-item"><h2>Add action item</h2><ItemForm meeting={meeting} /></section><section className="panel"><details><summary>Edit meeting</summary><MeetingForm departments={departments} meeting={meeting} date={today()} /></details><DeleteForm id={id} kind="meeting" /></section></div>}</div></>;
}
