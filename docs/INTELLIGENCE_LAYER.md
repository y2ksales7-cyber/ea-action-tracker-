# EA Action Tracker — Intelligence Layer

## Messy inputs (later)
EA pastes raw meeting notes / transcripts. AI extracts structured action items.

## Auto-structure schema (JSON example)
```json
{
  "meeting_date": "2025-01-15",
  "department": "Finance",
  "topic": "Q1 Budget Review",
  "items": [
    {
      "description": "Submit revised Q1 budget by Friday",
      "assignee": "Finance HOD",
      "priority": "High",
      "deadline": "2025-01-17",
      "ai_source": "gpt-4o",
      "ai_confidence": 0.88,
      "ai_review_status": "unreviewed"
    }
  ]
}
```

## Events to track (later)
- `item.created`, `item.status_changed`, `item.deadline_updated`, `reminder.due_soon`, `reminder.overdue`

## Scoring / ranking rules (v1, rule-based)
Priority weight: High = 3, Medium = 2, Low = 1.
Sort key = `priority_weight DESC, deadline ASC`.
Overdue flag: `deadline < CURRENT_DATE AND status != 'Done'`.
Due-soon flag: `deadline <= CURRENT_DATE + 7 AND status != 'Done'`.

## What gets ranked
Action items on the Board, sorted by urgency (priority then deadline).

## v1 vs later
- **v1:** Rule-based ranking + overdue/due-soon flags — pure SQL, no model.
- **Later:** AI note extraction, auto-assignee detection, priority suggestion, reminder email drafts.