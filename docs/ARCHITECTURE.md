# EA Action Tracker — Architecture

## Stack
- **Frontend:** Next.js (App Router, TypeScript, Tailwind)
- **Backend:** Supabase (Postgres + RLS)
- **Hosting:** Vercel

## Build now vs later
- **Now:** Meeting CRUD, Action Item CRUD, ranked board, overdue/due-soon flags, status updates
- **Later:** Login + per-user RLS, email reminders, AI meeting-note extraction, dashboard charts

## Key user action flow (EA adds an action item)
1. EA opens the Action Board (homepage, no login)
2. Clicks "New Meeting" → picks department, date, topic → saves
3. On the meeting detail page, clicks "Add Action Item"
4. Fills description, assignee, priority (High/Medium/Low), deadline → saves
5. Board re-renders: new item appears, ranked by priority then deadline
6. Overdue items show red; due-this-week items show amber

## Responsive nav shell
Left sidebar (desktop) with: **Board**, **Meetings**, **Departments**, **Reports**. Collapses to hamburger on mobile. Current section highlighted.

## Layer plan
1. **Data layer** — Supabase tables, RLS policies, data-access module (`lib/data/`)
2. **App logic** — server actions for CRUD, ranking/sorting logic, overdue calc
3. **Smart features (later)** — AI extraction of action items from meeting notes, auto-priority suggestions

## Why core runs without AI
Ranking is pure SQL/order-by (priority weight + deadline date). Overdue is a date comparison. No model calls needed. AI is additive (later) for note-to-item extraction.

## Repo structure
```
lib/data/          # all DB reads/writes (meetings, items, departments)
lib/actions/        # server actions (createMeeting, updateItem, etc.)
lib/ranking.ts      # priority + deadline sort logic
lib/ai/             # (later) note extraction
components/         # UI components grouped by feature
app/                # routes
  board/page.tsx
  meetings/page.tsx
  meetings/[id]/page.tsx
  departments/page.tsx
__tests__/          # tests beside code
```

## Module map
| Module | Responsibility | Owns | Build order |
|---|---|---|---|
| departments | department list + seed | departments table | 1 |
| meetings | meeting CRUD | meetings table | 1 |
| action-items | action item CRUD + ranking | action_items table | 2 |
| board | ranked, filtered board view | reads from items + meetings | 3 |
| reminders (later) | due-soon/overdue panel | computed from items | 3 |