import Link from 'next/link';
import { readWorkspace } from '@/lib/data';
import { formatDate, today } from '@/lib/ranking';
import { MeetingForm } from '@/components/forms';
export const dynamic = 'force-dynamic';
export default async function Meetings() {
  const { departments, meetings, items } = await readWorkspace();
  return <><div className="page-heading"><div><p className="eyebrow">CAPTURE THE COMMITMENTS</p><h1>Meetings</h1><p className="subtitle">Turn the conversation into accountable action.</p></div><a className="button" href="#new-meeting">+ New meeting</a></div><div className="split-layout"><section className="panel"><h2>Meeting log <span className="count">{meetings.length}</span></h2>{!meetings.length && <p className="empty">No meetings yet. Click New Meeting.</p>}<div className="meeting-list">{meetings.map(m => <Link key={m.id} className="meeting-row" href={`/meetings/${m.id}`}><span className="department-tag">{departments.find(d => d.id === m.department_id)?.name}</span><h3>{m.topic}</h3><p>{formatDate(m.date)} · {items.filter(i => i.meeting_id === m.id).length} action items</p><span className="row-arrow">↗</span></Link>)}</div></section><section className="panel" id="new-meeting"><p className="eyebrow">START HERE</p><h2>New meeting</h2><MeetingForm departments={departments} date={today()} /></section></div></>;
}
