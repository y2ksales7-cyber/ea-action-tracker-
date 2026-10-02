# EA Action Tracker — Test Plan

## v1 success scenario (manual)
1. Open app (no login) → Board loads with seeded demo items
2. Go to Meetings → click "New Meeting" → select Finance, date today, topic "Q1 Budget" → save
3. New meeting appears in list → click it
4. Add action item: "Revise Q1 forecast", assignee "Finance HOD", priority High, deadline yesterday → save
5. Add action item: "Confirm vendor list", assignee "Finance HOD", priority Medium, deadline in 2 days → save
6. Add action item: "Archive old files", priority Low, deadline in 30 days → save
7. Go to Board → items appear ranked: High-overdue first (red), Medium-due-soon second (amber), Low last
8. Click the overdue item → set status to "In Progress" → it moves to In Progress group, stays red
9. Click the due-soon item → set status to "Done" → it moves to Done group, flag clears

**Pass:** Ranking correct, flags correct, status change persists on refresh.

## Empty state
- Delete all items (or fresh DB) → Board shows "No action items yet. Create a meeting to get started."
- No meetings → Meetings page shows "No meetings yet. Click New Meeting."

## Error state
- Supabase unreachable → Board shows "Couldn't load items. Check connection and retry." with retry button
- Submit form with missing required field → inline validation error, no submit

## Loading state
- Board shows skeleton rows while fetching
- Form submit shows spinner on button, disabled state

## Cross-device
- Mobile: sidebar collapses to hamburger; board items stack vertically; forms full-width
- Desktop: sidebar visible; board items in responsive grid
## Team release verification

- Authenticated owner creates a workspace and five departments are available.
- Owner/admin invites an editor or viewer with one assigned department. Wrong email, reused, expired and revoked codes fail.
- Finance users see Finance only in board, due panel, meetings, departments and reports. Guessing an Assets meeting/item UUID yields no content; direct API requests remain isolated.
- Viewers see no create/edit/delete/status controls and direct writes are denied.
- Owners/admins retain the full EA workflow. Create a Finance meeting and three ranked actions, then mark an item Done with notes; refresh preserves it.
- Switch workspaces: counts and records change together, and teams cannot reference each other's departments/meetings through submitted IDs.
- Phone 390 x 844: no body overflow, bottom navigation works, menu locks background scroll and Escape restores focus, creation/status controls remain usable.
- Production signup delivery is verified only after custom SMTP is configured and an ordinary teammate confirms their email.
