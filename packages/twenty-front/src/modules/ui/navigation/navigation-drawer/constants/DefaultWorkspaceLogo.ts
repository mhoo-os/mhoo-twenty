export const DEFAULT_WORKSPACE_LOGO =
  'https://twentyhq.github.io/placeholder-images/workspaces/twenty-logo.png';

export function getDefaultWorkspaceLogo(
  isMhooFoundationEnabled: boolean,
): string {
  return isMhooFoundationEnabled
    ? '/images/mhoo/mhoo-snout-transparent-1024.png'
    : DEFAULT_WORKSPACE_LOGO;
}
