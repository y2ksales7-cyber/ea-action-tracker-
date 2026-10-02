import Link from 'next/link';
import { readWorkspace } from '@/lib/data';
import { rankItems, today, deadlineFlag, formatDate } from '@/lib/ranking';
import { ItemCard } from '@/components/item-card';
export const dynamic = 'force-dynamic';
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const department = typeof params.department === 'string' ? params.department : '';
  const status = typeof params.status === 'string' ? params.status : 'Active';
  const view = params.view === 'grouped' ? 'grouped' : 'ranked';
  const query = typeof params.q === 'string' ? params.q.trim().toLowerCase() : '';
  const { departments, meetings, items } = await readWorkspace();
  const date = today();
  const active = items.filter(i => i.status !== 'Done');
  const overdue = active.filter(i => deadlineFlag(i, date) === 'overdue');
  const soon = active.filter(i => deadlineFlag(i, date) === 'soon');
  const filtered = rankItems(items.filter(i => (!department || i.department_id === department) && (status === 'All' || status === 'Active' && i.status !== 'Done' || status === 'Overdue' && deadlineFlag(i, date) === 'overdue' || i.status === status) && (!query || `${i.description} ${i.assignee} ${i.notes ?? ''}`.toLowerCase().includes(query))));
  function card(item: typeof items[number]) { return <ItemCard key={item.id} item={item} department={departments.find(d => d.id === item.department_id)} meeting={meetings.find(m => m.id === item.meeting_id)} date={date} editable />; }
  const groupNames = ['Overdue', 'Open', 'In Progress', 'Done'];
  return <><div className="page-heading"><div><p className="eyebrow">EXECUTIVE OFFICE / ACTIONS</p><h1>Action board</h1><p className="subtitle">Every commitment. One clear next step.</p></div><Link className="button" href="/meetings#new-meeting">+ New meeting</Link></div>
    <div className="stats-grid"><div className="stat"><span>ACTIVE COMMITMENTS</span><strong>{active.length}</strong><small>Across {departments.length} departments</small></div><div className="stat red"><span>OVERDUE</span><strong>{overdue.length}</strong><small>Need a follow-up now</small></div><div className="stat amber"><span>DUE THIS WEEK</span><strong>{soon.length}</strong><small>Today through the next 7 days</small></div><div className="stat"><span>COMPLETED</span><strong>{items.length - active.length}</strong><small>Commitments closed</small></div></div>
    <form className="board-filters" method="get"><label>Department<select name="department" defaultValue={department}><option value="">All departments</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label><label>Status<select name="status" defaultValue={status}>{['Active','All','Open','In Progress','Done','Overdue'].map(s => <option key={s}>{s}</option>)}</select></label><label>View<select name="view" defaultValue={view}><option value="ranked">Ranked queue</option><option value="grouped">Status groups</option></select></label><label className="search">Search<input name="q" defaultValue={query} placeholder="Action, assignee, notes…" /></label><button>Apply filters</button><Link className="clear-filter" href="/">Reset</Link></form>
    <div className="board-layout"><section><div className="section-heading"><h2>{view === 'ranked' ? 'Priority queue' : 'Status board'} <span className="count">{filtered.length}</span></h2><span className="muted">Priority ↓ · Deadline ↑</span></div>
    {!items.length ? <div className="panel empty"><h2>No action items yet</h2><p>Create a meeting to get started.</p><Link className="button" href="/meetings#new-meeting">New meeting</Link></div> : !filtered.length ? <div className="panel empty"><h2>No matching action items</h2><p>Try another department, status, or search.</p><Link className="text-link" href="/">Reset filters →</Link></div> : view === 'ranked' ? <div className="ranked-list">{filtered.map(card)}</div> : <div className="status-columns">{groupNames.map(group => { const rows = filtered.filter(i => group === 'Overdue' ? deadlineFlag(i, date) === 'overdue' : i.status === group && deadlineFlag(i, date) !== 'overdue'); return <section className="status-column" key={group}><h2>{group} <span className="count">{rows.length}</span></h2>{rows.map(card)}{!rows.length && <p className="muted">No items in this group.</p>}</section>; })}</div>}
    </section><aside className="due-panel panel"><p className="eyebrow">THE WEEK AHEAD</p><h2>Due this week <span className="count">{soon.length}</span></h2><p className="muted">Keep these commitments moving.</p>{rankItems(soon).map(i => <Link key={i.id} className="due-row" href={`/meetings/${i.meeting_id}`}><strong>{i.description}</strong><span>{i.assignee}</span><small>{formatDate(i.deadline)} · {i.priority}</small></Link>)}{!soon.length && <p className="empty">No upcoming deadlines this week.</p>}<div className="followup-note"><strong>Start with the priority queue.</strong><p>Follow up on the highest priority, earliest deadline first. Done items clear their urgency flags.</p></div></aside></div></>;
}
