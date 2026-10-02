# Team workspaces and database security

The requested team release supersedes the anonymous-editable v1 demo. `0002_team_workspaces.sql` runs in one transaction against the existing `0001` schema. Existing rows remain in the read-only demo workspace `00000000-0000-4000-8000-000000000001`; they are never assigned to the first person who signs up. New private workspaces start with the five departments and no inherited demo records.

## Roles and boundaries

| Role | Workspace data | Team management |
|---|---|---|
| Owner | Read/create/edit/delete | Invite, revoke, change non-owner roles, remove non-owners |
| Admin | Read/create/edit/delete | Same non-owner management |
| Member | Read/create/edit/delete in assigned department only | Read membership list |
| Viewer | Read assigned department only | Read membership list |
| Anonymous visitor | Read demo only | None |

The workspace has one protected owner. Ownership transfer, workspace deletion, are not offered in this release. Members and viewers must be assigned exactly one department; owners and admins have workspace-wide access. Managers cannot demote/remove the owner. Membership changes happen through checked RPCs; clients have SELECT only on membership/workspace tables. Helpers use pinned search paths and caller `auth.uid()`; they do not accept a caller-controlled user identity. Invitations and hashes live in the unexposed `tracker_private` schema.

Every department, meeting, and action item has a required `workspace_id`. RLS verifies current membership and assigned department on each request; viewer writes are denied. Members/viewers cannot read another department through guessed record IDs, lists, or direct API calls. Changing department assignment immediately changes that scope. Membership metadata remains visible to authenticated teammates; action content is department-private. Composite foreign keys prevent meeting/department/action links across tenants, even when someone belongs to both workspaces. A trigger prevents moving existing records between tenants. The previous permissive read and FOR ALL policies are removed, and anonymous DML grants are revoked.

## RPC contract

- `create_workspace(p_name text) → uuid`: verified authenticated email required; atomically creates owner membership and five departments.
- `create_workspace_invite(p_workspace_id uuid, p_email text, p_role text = 'member', p_department_id uuid = null) → text`: manager only; returns a random invitation token once. Share its app acceptance link manually. No email is sent. The database stores only its SHA-256 hash; link expires after seven days. Reissuing for the same workspace/email revokes prior links.
- `accept_workspace_invite(p_token text) → uuid`: verified current auth email must exactly match the invited email (case-insensitive). Row locking makes acceptance single-use. It does not upgrade an already-existing member.
- `list_workspace_members(p_workspace_id uuid) → rows(user_id, role, department_id, display_name, email, joined_at)`: membership required; emails are visible only within that workspace.
- `list_workspace_invites(p_workspace_id uuid) → rows(id, workspace_id, email, role, department_id, created_at, expires_at, accepted_at, revoked_at)`: managers only; never returns hashes/tokens.
- `revoke_workspace_invite(p_invite_id uuid) → void`: manager of that invitation's workspace required.
- `remove_workspace_member(p_workspace_id uuid, p_user_id uuid) → void`: manager only, owner protected.
- `set_workspace_member_role(p_workspace_id uuid, p_user_id uuid, p_role text, p_department_id uuid = null) → void`: manager only; admin/member/viewer accepted; owner protected. Member/viewer invitations and role changes require a department in the same workspace; admin assignments require a null department.

The app must use the cookie-backed authenticated Supabase client, explicitly filter its selected workspace, derive linked departments from the selected meeting, and hide mutation forms for viewers. RLS remains the authority if the app's checks are bypassed. Configure Supabase Auth Site URL and allowed callback URLs for the live domain and local development; email verification must complete before creating or joining workspaces.

## Apply and verify

Apply the new migration using an authenticated Supabase migration connection or SQL editor as database owner. The public anon key cannot create tables, policies, or privileged RPCs. Never edit or rerun `0001`. This migration has no credential material. Any constraint failure rolls back all changes; investigate existing malformed cross-department rows before retrying rather than weakening foreign keys.

`supabase/tests/tenancy.integration.mjs` executes both migrations in isolated PostgreSQL through `@electric-sql/pglite`, with an `auth.users`/`auth.uid()` fixture. Run using `pnpm test:tenancy`; the test-only package is a dev dependency. The test covers seeds, private reads, CRUD persistence, cross-tenant updates, viewers, invitation recipient checks/reuse, composite foreign keys, tenant immutability, owner protection, anonymous demo grants, and anonymous RPC denial. It does not replace production verification of Supabase JWT/session handling, verified-email signup, invite links, or browser workflows. No production data is changed by this test.
