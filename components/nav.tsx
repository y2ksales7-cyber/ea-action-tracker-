'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return <><header className="mobile-header"><strong>EA / Action Tracker</strong><button className="secondary" aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}>☰ <span className="sr-only">Menu</span></button></header>
    <aside id="navigation" className={`sidebar ${open ? 'visible' : ''}`}><Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark">ea</span><span>Action Tracker<small>EXECUTIVE OFFICE</small></span></Link><div className="nav-label">WORKSPACE</div><nav>{[['/', '◫', 'Board'], ['/meetings', '▤', 'Meetings'], ['/departments', '◈', 'Departments'], ['/reports', '↗', 'Reports']].map(([href, icon, label]) => <Link onClick={() => setOpen(false)} key={href} href={href} aria-current={(href === '/' ? path === '/' || path === '/board' : path.startsWith(href)) ? 'page' : undefined}><span aria-hidden="true">{icon}</span>{label}</Link>)}</nav><div className="sidebar-bottom"><span className="demo-dot" /> Shared demo workspace<small>Manual tracking · No AI required</small><p>Use demo information only. This workspace is publicly editable.</p></div></aside></>;
}
