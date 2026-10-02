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