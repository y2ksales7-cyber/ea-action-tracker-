import Link from 'next/link';
import { readWorkspace } from '@/lib/data';
import { rankItems, today } from '@/lib/ranking';
import { ItemCard } from '@/components/item-card';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const { departments, meetings, items } = await readWorkspace();
  return <><div className="page-heading"><div><p className="eyebrow">EXECUTIVE OFFICE / ACTIONS</p><h1>Action board</h1><p className="subtitle">Every commitment. One clear next step.</p></div><Link className="button" href="/meetings#new-meeting">+ New meeting</Link></div><section className="panel"><h2>Priority queue <span className="count">{items.length}</span></h2><p className="muted">High priority first, then earliest deadline.</p><div className="item-grid">{rankItems(items).map(item => <ItemCard key={item.id} item={item} department={departments.find(d => d.id === item.department_id)} meeting={meetings.find(m => m.id === item.meeting_id)} date={today()} />)}</div>{!items.length && <div className="empty"><h2>No action items yet</h2><p>Create a meeting to get started.</p><Link className="button" href="/meetings#new-meeting">New meeting</Link></div>}</section></>;
}
