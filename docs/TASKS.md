# EA Action Tracker — Sprints

## Sprint 1 — DB + Core CRUD (no login wall)
**Goal:** Database ready, meetings + action items can be created/listed.
- [ ] Run migration SQL; seed 5 departments + demo meetings + demo items
- [ ] `lib/data/` data-access layer for departments, meetings, action_items
- [ ] Server actions: createMeeting, updateMeeting, deleteMeeting, createItem, updateItem, deleteItem
- [ ] Meetings page: list + create form (date, department dropdown, topic)
- [ ] Meeting detail page: list items + add-item form (description, assignee, priority, deadline)
- [ ] Seed data renders on first load (anonymous)

**DoD:** Anonymous visitor sees seeded meetings + items; can create a new meeting and add an action item; data persists to Supabase.

## Sprint 2 — Ranked Board + Overdue Flags ← v1 functional milestone
**Goal:** The one core workflow — see prioritized actions and who to chase.
- [ ] Board page: all action items, grouped by status (Open / In Progress / Done)
- [ ] Rank by priority weight DESC then deadline ASC
- [ ] Overdue items flagged red; due-this-week flagged amber
- [ ] Filter by department + status
- [ ] Inline status update (Open → In Progress → Done) with notes
- [ ] Left sidebar nav (Board, Meetings, Departments) + mobile hamburger
- [ ] Empty state, loading state, error state for board

**DoD (success scenario):** EA creates a Finance meeting, adds 3 items with deadlines, opens Board — items ranked by priority+deadline, overdue item at top in red, due-soon item amber. EA marks one item Done and it moves to the Done group. This is the **v1 functional milestone**.

## Sprint 3 — Departments view + Reports basics
**Goal:** Lightweight department-level views.
- [ ] Departments page: per-department item counts + open vs done
- [ ] Simple report: items by department, overdue count
- [ ] Sorting + filtering refinements

**DoD:** Each department page shows its items and overdue counts.

## Sprint 4 — Lock it down (auth + RLS)
**Goal:** Secure for real use.
- [ ] Supabase Auth (signup/login)
- [ ] Add `user_id` population on insert
- [ ] Replace permissive RLS with owner-scoped policies (`auth.uid() = user_id`)
- [ ] Role check stub: EA / CEO / HOD (read scope differences)
- [ ] Protect all routes; redirect to login

**DoD:** Logged-out user cannot read/write data; logged-in EA sees only their own workspace.

## Sprint 5 — AI note extraction + reminder drafts (later)
- [ ] Paste meeting notes → AI extracts structured items (review_status = unreviewed)
- [ ] Compose reminder draft for due-soon items (no auto-send)
- [ ] Audit log table + logging on status changes

## Text Gantt
```
Sprint 1: DB + CRUD         ████
Sprint 2: Board + Ranking    ████  ← v1 functional
Sprint 3: Departments        ██
Sprint 4: Auth + RLS         ██
Sprint 5: AI + Reminders     ████
```