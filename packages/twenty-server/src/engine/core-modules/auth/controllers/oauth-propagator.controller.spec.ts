import { OAuthPropagatorController } from 'src/engine/core-modules/auth/controllers/oauth-propagator.controller';
import { NodeEnvironment } from 'src/engine/core-modules/twenty-config/interfaces/node-environment.interface';

describe('OAuthPropagatorController', () => {
  const domainServerConfigService = {
    getFrontUrl: jest.fn(() => new URL('https://app.mhoo.app')),
  };
  const twentyConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') {
        return NodeEnvironment.PRODUCTION;
      }

      if (key === 'IS_MHOO_FOUNDATION_ENABLED') {
        return true;
      }

      return undefined;
    }),
  };
  const workspaceDomainsService = {
    getWorkspaceByOriginOrDefaultWorkspace: jest.fn(),
  };
  const controller = new OAuthPropagatorController(
    domainServerConfigService as any,
    twentyConfigService as any,
    workspaceDomainsService as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('allows only the configured stable origin in Mhoo mode', async () => {
    await expect(
      (controller as any).isValidDomain(new URL('https://app.mhoo.app/auth')),
    ).resolves.toBe(true);

    expect(
      workspaceDomainsService.getWorkspaceByOriginOrDefaultWorkspace,
    ).not.toHaveBeenCalled();
  });

  it('rejects an external OAuth callback target in Mhoo mode', async () => {
    await expect(
      (controller as any).isValidDomain(
        new URL('https://attacker.example/auth'),
      ),
    ).resolves.toBe(false);

    expect(
      workspaceDomainsService.getWorkspaceByOriginOrDefaultWorkspace,
    ).not.toHaveBeenCalled();
  });
});
