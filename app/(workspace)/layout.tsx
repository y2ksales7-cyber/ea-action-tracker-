import { Nav } from '@/components/nav';
import { getWorkspace } from '@/lib/workspaces';
import { switchWorkspace, signOut } from '@/lib/team-actions';
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { workspace, workspaces, user } = await getWorkspace();
  return <><Nav workspace={workspace} workspaces={workspaces} account={{ email: user.email ?? '' }} switchAction={switchWorkspace} signOutAction={signOut} /><main className="workspace" id="main-content" tabIndex={-1}>{children}</main></>;
}
