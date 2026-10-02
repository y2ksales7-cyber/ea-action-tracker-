# OpenRouter and MCP setup

## OpenRouter

1. Create a key at https://openrouter.ai/settings/keys. The account holder enters and saves credentials; do not put the key into chat or source files.
2. In https://vercel.com/ll-c168/ea-action-tracker-/settings/environment-variables add server-only `OPENROUTER_API_KEY` for Production. Optionally set `OPENROUTER_MODEL`; default is `openrouter/free`. Free routing/model availability and rate limits are controlled by OpenRouter. No credits are purchased automatically.
3. Redeploy the latest Git commit after environment changes.
4. Open a meeting, paste notes and choose Extract action drafts. Check descriptions, assignees, priorities and dates, deselect unwanted drafts, then Save reviewed actions. Drafts are never auto-saved. Missing dates/assignees must be filled before saving. The insert is atomic and inherits the meeting's department and user's RLS.
5. An unfinished action has Draft a reminder. It returns selectable text, never sends a message. Only the notes or action fields disclosed in the form are sent to OpenRouter and its selected provider. Do not submit confidential notes unless your organization allows this provider.

## MCP authentication — Supabase only

The app hosts a stateless Streamable HTTP MCP server at `https://ea-action-tracker.vercel.app/mcp`. Supabase runs the OAuth authorization server, PKCE, code exchange, refresh and registered client management. No app-created static shared secret, service-role API access, custom password store or replacement OAuth server is used.

1. Apply `0003_ai_mcp.sql` once after 0002. This adds per-user/client/workspace consent records, restrictive OAuth policies, reviewed AI metadata, append-only action audit logs, and an access-token hook. This migration was applied successfully to the provisioned project on 2 October 2026.
2. At https://supabase.com/dashboard/project/pmlcuwaopftdsbhyqnze/auth/oauth-server enable OAuth Server, set the authorization path to `/oauth/consent`, and enable dynamic client registration. The Site URL must be `https://ea-action-tracker.vercel.app`.
3. At https://supabase.com/dashboard/project/pmlcuwaopftdsbhyqnze/auth/hooks enable Custom Access Token using the Postgres function `public.tracker_oauth_access_token_hook`. It preserves regular user claims; approved OAuth tokens receive both `authenticated` and the MCP resource in `aud`. The MCP endpoint rejects tokens without the expected resource, verified issuer, expiration and OAuth client ID. Setting the hook is required, not an optional security relaxation.
4. Add a remote MCP server in the client (ChatGPT Work or Cowork) using `https://ea-action-tracker.vercel.app/mcp` and OAuth. Availability depends on the client, account and workspace policies. Supabase's metadata handles OAuth discovery and client registration. Approve from your existing Action Tracker account and select exactly one workspace. Sign-in preserves the pending consent request.
5. Ask which actions are overdue or which assignee to chase first. Four tools are exposed: `list_action_items`, `list_meetings`, `get_action_item`, `compose_reminder`. Every tool is read-only; reminder composition is deterministic and does not call OpenRouter or send email. Text returned by records is untrusted data, never executable instructions.
6. Revoke access in the app's AI & connections page. Removing the per-client consent immediately denies new MCP reads and direct OAuth API reads; Supabase grant revocation also invalidates refresh tokens. Department membership changes take effect through RLS without reconnecting.

OAuth clients cannot insert, update or delete departments, meetings or actions through Supabase REST, nor call the existing team management RPCs. They can read action content only in their consented workspace and permitted department. A regular user session cannot be substituted for an MCP token.

## Verification status

Strict TypeScript, ESLint, production build, ranking/schema/MCP protocol tests and PostgreSQL tenant/department/OAuth policy tests pass. Tests exercise SDK initialization, four-tool discovery, ranking, missing guessed IDs, read-only annotations, invalid arguments, token/origin rejection, write and management RPC denial, audience hook and connection revocation. Live OpenRouter generation needs a supplied API key. The complete external OAuth connection needs the OAuth settings and hook enabled and client consent; those are not counted as passed until actually exercised.

References: https://openrouter.ai/docs/quickstart, https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication, https://supabase.com/docs/guides/auth/oauth-server/token-security, https://developers.openai.com/plugins/build/auth.
