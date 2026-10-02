# EA Action Tracker — PRD

## Problem
The EA manually sorts action items from meetings between the CEO and five department heads (Assets, Project, Leasing, Finance, Philanthropy), then chases each HOD as deadlines approach. Items get lost across meetings; accountability is unclear; reminders are ad-hoc.

## Target user
- **Primary:** Executive Assistant (creates/edits items, sends reminders)
- **Secondary:** CEO (views all items, checks accountability)
- **Tertiary:** HODs (see their own items, update status)

## Core objects
- **Department** — name (Assets, Project, Leasing, Finance, Philanthropy)
- **Meeting** — date, department, topic, attendees
- **Action Item** — description, department, assignee (HOD), meeting, priority, deadline, status, notes
- **Reminder** — generated for items approaching deadline

## MVP (v1) — checklist
- [ ] Create/edit/delete a Meeting (date, department, topic)
- [ ] Create/edit/delete Action Items linked to a meeting, with priority + deadline
- [ ] Action board: all items grouped by status (Open / In Progress / Done / Overdue)
- [ ] Filter by department and by status
- [ ] Sort by priority then deadline (ranked view)
- [ ] Auto-flag overdue items; show "due this week" panel
- [ ] Mark item complete; update status with notes
- [ ] Seed demo data so the board looks alive on first visit

## Non-goals (v1)
- No login/auth (demo-first; lock-down later)
- No email/SMS sending
- No AI summarization or auto-tagging
- No file attachments
- No recurring meeting series

## Success criteria
EA opens the app, creates a Meeting with the Finance HOD, adds three action items with deadlines, then views the board sorted by priority + deadline — the two most urgent items (one overdue, one due in 2 days) appear at the top with a red/amber flag so the EA knows exactly who to chase first.