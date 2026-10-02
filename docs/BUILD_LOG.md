# Build verification

## Sprint 1
- Implemented database-backed meeting and action item create, read, update, delete using anonymous Supabase access.
- Meeting detail supports priority, deadline, assignee, status, notes, and explicit deletion confirmation.
- Homepage already lists items ranked by priority and deadline with urgency flags.
- Responsive navigation, pending feedback, validation, loading, error and missing-record states implemented.
- Strict TypeScript and production build passed. Three ranking/date-boundary tests passed. ESLint passed.
- Live database verification is pending Vercel authentication: environment pull currently reports no credentials.
- Existing 0001 migration remains unchanged; it has not been rerun blindly.

Sprints are implementation checkpoints. Live PRD success verification will be recorded separately after environment access is available.

## Sprint 2
- Added ranked and grouped board views, department/status filters, search, overdue filter, and due-this-week panel.
- Inline status and notes updates persist through server actions and revalidate every workspace page.
- Completed items clear their flags and can be viewed with the Done or All filters.
- TypeScript, ESLint, production build and three ranking tests passed.
- Live database and browser success scenario remain pending Vercel email sign-in.

## Sprint 3
- Added department overview/detail views with live active, done, overdue and completion counts.
- Added report table and totals, linking back to department workspaces.
- Added a real anonymous database verification script with scoped temporary-record cleanup.
- Strict TypeScript, ESLint and production build passed; all three ranking tests passed.
- Browser inspection found the provisioned Vercel project has no connected Git repository. Git pushes succeed but cannot auto-deploy until its GitHub integration is connected.
- Vercel browser sign-in works; CLI device authorization remains incomplete, so live table/CRUD verification is still pending.

## Live verification — 2 October 2026
- Retrieved the existing public Supabase URL/anon key from the authenticated Vercel environment UI into ignored `.env.local`; no secrets committed. The requested CLI env pull was attempted but is still blocked by incomplete CLI authorization.
- Verified departments, meetings, action_items and all five seed departments exist. Did not apply or recreate 0001.
- Ran `scripts/verify-db.mjs --crud`: real anonymous insert/update/status/notes/read/delete and meeting cascade passed; temporary verification data was cleaned up.
- Browser PRD scenario passed on localhost against the real provisioned Supabase database: created a Finance meeting, added High-overdue, Medium-in-two-days, Low-in-thirty-days items through the app's forms, verified relative ranking and red/amber flags, moved High to In Progress and Medium to Done, and verified notes/status after refresh.
- Grouped view preserves status groups (overdue In Progress remains in that group with its red flag); Overdue is also a selectable filter.
- Fixed stale edit form defaults after inline status updates and verified editing notes preserves In Progress.
- Department overview/detail and report navigation verified; mobile hamburger opens and closes, no horizontal overflow at the observed 699px viewport. Explicit viewport override was not honored by the in-app browser, so a distinct desktop-width visual test remains unverified.
- Browser verification records removed after screenshots. Original seed records were not modified.
- Vercel GitHub app installation prepared for only `y2ksales7-cyber/ea-action-tracker-`; awaiting confirmation at final Install. Without this connection, Git pushes do not trigger deployments.

- Final configured production build, strict TypeScript, ESLint and all ranking tests passed after browser-tested fixes.

## Deployment connection — 2 October 2026
- GitHub confirmed the Vercel app was already installed. Its existing installation settings were preserved.
- Connected the existing Vercel project `ll-c168/ea-action-tracker-` to `y2ksales7-cyber/ea-action-tracker-`.
- Pushing this recorded connection to main to trigger the first Git-based app deployment.

## Team, department privacy, and mobile release

- User confirmed each department sees only its own actions. Owners/admins coordinate across departments; editors/viewers must have one assigned department.
- Applied 0002_team_workspaces.sql successfully in the provisioned Supabase project; migration is atomic and legacy records remain archived read-only.
- Replaced anonymous application clients with verified cookie-backed sessions, private route layout, team creation/switching, recipient-bound expiring invitations, role/department management, and viewer controls.
- New desktop/mobile mockup and responsive UI implemented. Actual 390 x 844 phone workflow creates a Finance meeting and three actions, ranks overdue/due-soon correctly, updates status/notes, and persists after refresh. Menu scroll lock and Escape focus restoration passed with no body overflow.
- PostgreSQL integration tests pass tenant/department boundaries, viewer write denial, recipient/expiry/revocation checks, removed-member denial, immutable tenant IDs and composite foreign keys.
- Live Supabase tests with disposable confirmed users pass direct API tenant/department isolation, wrong-department writes, invitation acceptance/reuse denial and notes persistence.
- Production Supabase Site URL set to https://ea-action-tracker.vercel.app. Custom SMTP is currently absent; ordinary team signup confirmation delivery requires provider setup. This external setup is pending, not counted as verified signup delivery.
- Browser invitation creation and acceptance passed for a second disposable user: Finance only, then independent workspace switch to an empty board. A Finance viewer has zero mutation controls, and a guessed Assets meeting URL returns the not-found view.
