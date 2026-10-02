'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

type NavProps = {
  workspace?: { id: string; name: string; role?: string };
  account?: { email: string };
  workspaces?: { id: string; name: string }[];
  switchAction?: (form: FormData) => Promise<void>;
  signOutAction?: (form: FormData) => Promise<void>;
};
const links = [
  ['/', '◫', 'Board'], ['/meetings', '▤', 'Meetings'],
  ['/departments', '◈', 'Departments'], ['/reports', '↗', 'Reports'],
  ['/team', '◎', 'Team'],
  ['/integrations', '✧', 'AI & connections'],
];

function NavSubmit({ children, pendingLabel, className = '' }: { children: string; pendingLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={`secondary ${className}`} disabled={pending}>{pending ? pendingLabel : children}</button>;
}

export function Nav({ workspace, account, workspaces = [], switchAction, signOutAction }: NavProps = {}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const isActive = (href: string) => href === '/' ? path === '/' || path === '/board' : path.startsWith(href);
  const close = () => { setOpen(false); toggle.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const mobile = window.matchMedia('(max-width: 720px)');
    if (mobile.matches) document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (event.key !== 'Tab' || !mobile.matches) return;
      const controls = [toggle.current, ...Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), select:not(:disabled)') ?? [])].filter((element): element is HTMLElement => !!element);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const onResize = () => { if (!mobile.matches) setOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    mobile.addEventListener('change', onResize);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
      mobile.removeEventListener('change', onResize);
    };
  }, [open]);

  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="mobile-header">
      <Link className="mobile-brand" href="/" onClick={() => setOpen(false)}><span className="brand-mark">ea</span><span>Action Tracker<small>{workspace?.name ?? 'Executive office'}</small></span></Link>
      <button ref={toggle} type="button" className="secondary mobile-menu-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? '×' : '☰'}</span></button>
    </header>
    {open && <button type="button" className="mobile-backdrop" aria-label="Close navigation" tabIndex={-1} onClick={close} />}
    <aside ref={sidebar} id="navigation" className={`sidebar ${open ? 'visible' : ''}`}>
      <Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark">ea</span><span>Action Tracker<small>EXECUTIVE OFFICE</small></span></Link>
      <div className="workspace-switcher">
        {switchAction && workspaces.length > 1 ? <form action={switchAction} onSubmit={() => setOpen(false)}><label htmlFor="nav-workspace">Workspace</label><select key={workspace?.id} id="nav-workspace" name="workspace_id" defaultValue={workspace?.id} aria-label="Switch workspace">{workspaces.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select><NavSubmit pendingLabel="Switching…">Switch workspace</NavSubmit></form> : <Link href="/team" onClick={() => setOpen(false)}><span className="workspace-avatar" aria-hidden="true">{workspace?.name?.slice(0, 1).toUpperCase() ?? 'E'}</span><span><strong>{workspace?.name ?? 'Demo workspace'}</strong><small>{workspace?.role ?? 'Manage your team'}</small></span><span aria-hidden="true">⌄</span></Link>}
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">{links.map(([href, icon, label]) => <Link onClick={() => setOpen(false)} key={href} href={href} aria-current={isActive(href) ? 'page' : undefined}><span aria-hidden="true">{icon}</span>{label}</Link>)}</nav>
      <div className="sidebar-bottom">{account ? <><div className="account-info"><span className="account-avatar" aria-hidden="true">{account.email.slice(0, 1).toUpperCase()}</span><span><strong>{account.email}</strong><small>{workspace?.role === 'member' ? 'Department editor' : workspace?.role ?? 'Team member'}</small></span></div>{signOutAction && <form action={signOutAction}><NavSubmit className="sign-out" pendingLabel="Signing out…">Sign out</NavSubmit></form>}</> : <><span className="demo-dot" /> Shared demo workspace<small>Manual tracking · No AI required</small><p>Use demo information only. This workspace is publicly editable.</p></>}</div>
    </aside>
    <nav className="mobile-nav" aria-label="Mobile quick navigation">{links.filter(([href]) => ['/', '/meetings', '/departments', '/team'].includes(href)).map(([href, icon, label]) => <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} onClick={() => setOpen(false)}><span aria-hidden="true">{icon}</span><span>{label}</span></Link>)}</nav>
  </>;
}
