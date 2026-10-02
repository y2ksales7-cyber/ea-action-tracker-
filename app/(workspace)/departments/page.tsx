import Link from 'next/link';
import { readWorkspace } from '@/lib/data';
import { deadlineFlag, today } from '@/lib/ranking';
export const dynamic = 'force-dynamic';
export default async function Departments() {
  const { departments, items, meetings } = await readWorkspace();
  const date = today();
  return <><div className="page-heading"><div><p className="eyebrow">ACCOUNTABILITY AT A GLANCE</p><h1>Departments</h1><p className="subtitle">A clear view of each team’s commitments.</p></div></div><div className="department-grid">{departments.map(d => {
    const rows = items.filter(i => i.department_id === d.id);
    const done = rows.filter(i => i.status === 'Done').length;
    const overdue = rows.filter(i => deadlineFlag(i, date) === 'overdue').length;
    return <Link className="panel department-card" key={d.id} href={`/departments/${d.id}`}><div className="department-icon">{d.name.slice(0,1)}</div><h2>{d.name} <span className="row-arrow">↗</span></h2><p className="muted">{meetings.filter(m => m.department_id === d.id).length} meetings · {rows.length} action items</p><div className="department-counts"><div><strong>{rows.length - done}</strong><span>Active</span></div><div><strong>{done}</strong><span>Done</span></div><div className="red-text"><strong>{overdue}</strong><span>Overdue</span></div></div><progress max={rows.length || 1} value={done} aria-label={`${d.name} completed items`} /><small className="muted">{rows.length ? Math.round(done / rows.length * 100) : 0}% completed</small></Link>;
  })}</div>{!departments.length && <div className="panel empty"><h2>No departments configured</h2><p>The database seed needs to be applied before meetings can be created.</p></div>}</>;
}
