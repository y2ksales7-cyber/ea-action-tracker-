# EA Action Tracker — Data Model

## departments
| Field | Type |
|---|---|
| id | uuid pk |
| name | text not null |
| created_at | timestamptz default now() |
| user_id | uuid nullable |

## meetings
| Field | Type |
|---|---|
| id | uuid pk |
| department_id | uuid → departments.id |
| date | date not null |
| topic | text not null |
| attendees | text[] |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## action_items
| Field | Type |
|---|---|
| id | uuid pk |
| meeting_id | uuid → meetings.id |
| department_id | uuid → departments.id |
| description | text not null |
| assignee | text not null |
| priority | text not null default 'Medium' (High/Medium/Low) |
| deadline | date not null |
| status | text not null default 'Open' (Open/In Progress/Done) |
| notes | text |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

**Derived (not stored):** `is_overdue` = deadline < today AND status != 'Done'. Computed in query/UI.

**AI fields (later):** If AI extracts items from notes, add `ai_source text`, `ai_confidence numeric`, `ai_review_status text default 'unreviewed'`.

## Relationships
- department 1—N meetings
- meeting 1—N action_items
- department 1—N action_items (denormalized for filtering)

## RLS / permissions
- **v1 (demo):** permissive read/write for all (no auth)
- **Lock-down:** `auth.uid() = user_id` on all tables (owner-scoped)
- CEO sees all; HODs see only their department's items; EA sees all (role field on profile, later)