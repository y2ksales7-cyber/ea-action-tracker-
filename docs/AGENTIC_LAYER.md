# EA Action Tracker — Agentic Layer

## Draftable actions (low risk — auto, later)
- Draft reminder message for an approaching-deadline item (composes text, does NOT send)
- Draft priority suggestion for a new item based on description + deadline

## Executable-after-approval (medium risk — later)
- Send reminder email to HOD for due-soon item (approved by EA)
- Auto-update item status to "In Progress" if HOD replies "started"

## Human-only (high risk)
- Delete an action item
- Change a deadline after it has passed
- Reassign item to a different department

## Named tools (later)
- `compose_reminder(item_id)` → returns draft text
- `send_reminder_email(item_id, to_email)` → sends via approved email provider
- `suggest_priority(description, deadline)` → returns High/Medium/Low

## Audit-log fields (later)
`action text, actor uuid, item_id uuid, tool_name text, risk_level text, approved_by uuid, created_at timestamptz`

## v1 vs later
- **v1:** No agentic actions — all CRUD is manual by the EA.
- **Later:** Reminder drafting → EA approval → email send → audit log. Risk-graded.