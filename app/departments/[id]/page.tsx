import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readWorkspace } from '@/lib/data';
import { deadlineFlag, rankItems, today, formatDate } from '@/lib/ranking';
import { ItemCard } from '@/components/item-card';
export const dynamic = 'force-dynamic';
export default async function DepartmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { departments, meetings, items } = await readWorkspace();
  const department = departments.find(d => d.id === id);
  if (!department) notFound();
  const date = today();
  const rows = rankItems(items.filter(i => i.department_id === id));
  const departmentMeetings = meetings.filter(m => m.department_id === id);
  return <><Link className="back-link" href="/departments">← All departments</Link><div className="page-heading"><div><p className="eyebrow">DEPARTMENT COMMITMENTS</p><h1>{department.name}</h1><p className="subtitle">{rows.filter(i => i.status !== 'Done').length} active · {rows.filter(i => deadlineFlag(i, date) === 'overdue').length} overdue · {rows.filter(i => i.status === 'Done').length} done</p></div><Link className="button" href={`/?department=${id}`}>View filtered board</Link></div><div className="split-layout"><section className="panel"><h2>Ranked action items</h2><div className="item-grid single">{rows.map(item => <ItemCard key={item.id} item={item} department={department} meeting={meetings.find(m => m.id === item.meeting_id)} date={date} editable />)}</div>{!rows.length && <p className="empty">No action items for this department yet.</p>}</section><section className="panel"><h2>Meeting history</h2>{departmentMeetings.map(m => <Link className="meeting-row" key={m.id} href={`/meetings/${m.id}`}><h3>{m.topic}</h3><p>{formatDate(m.date)}</p><span className="row-arrow">↗</span></Link>)}{!departmentMeetings.length && <p className="muted">No meetings yet.</p>}<Link href="/meetings#new-meeting" className="text-link">Create a meeting →</Link></section></div></>;
}
