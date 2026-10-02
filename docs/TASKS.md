# EA Action Tracker — Sprints

## Sprint 1 — DB + Core CRUD (no login wall)
**Goal:** Database ready, meetings + action items can be created/listed.
- [x] Run migration SQL; seed 5 departments + demo meetings + demo items
- [x] `lib/data/` data-access layer for departments, meetings, action_items
- [x] Server actions: createMeeting, updateMeeting, deleteMeeting, createItem, updateItem, deleteItem
- [x] Meetings page: list + create form (date, department dropdown, topic)
- [x] Meeting detail page: list items + add-item form (description, assignee, priority, deadline)
- [x] Seed data renders on first load (anonymous)

**DoD:** Anonymous visitor sees seeded meetings + items; can create a new meeting and add an action item; data persists to Supabase.

## Sprint 2 — Ranked Board + Overdue Flags ← v1 functional milestone
**Goal:** The one core workflow — see prioritized actions and who to chase.
- [x] Board page: all action items, grouped by status (Open / In Progress / Done)
- [x] Rank by priority weight DESC then deadline ASC
- [x] Overdue items flagged red; due-this-week flagged amber
- [x] Filter by department + status
- [x] Inline status update (Open → In Progress → Done) with notes
- [x] Left sidebar nav (Board, Meetings, Departments) + mobile hamburger
- [x] Empty state, loading state, error state for board

**DoD (success scenario):** EA creates a Finance meeting, adds 3 items with deadlines, opens Board — items ranked by priority+deadline, overdue item at top in red, due-soon item amber. EA marks one item Done and it moves to the Done group. This is the **v1 functional milestone**.

## Sprint 3 — Departments view + Reports basics
**Goal:** Lightweight department-level views.
- [x] Departments page: per-department item counts + open vs done
- [x] Simple report: items by department, overdue count
- [x] Sorting + filtering refinements

**DoD:** Each department page shows its items and overdue counts.

## Sprint 4 — Lock it down (auth + RLS)
**Goal:** Secure for real use.
- [x] Supabase Auth (signup/login); custom SMTP delivery still needs provider setup
- [x] Add `user_id` and selected workspace population on insert
- [x] Replace permissive RLS with workspace membership and strict assigned-department policies
- [x] Owner/admin/editor/viewer roles; department editors/viewers only see their assigned department
- [x] Protect workspace routes; redirect logged-out visitors to login

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
