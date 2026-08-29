import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { PublicDomainEntity } from 'src/engine/core-modules/public-domain/public-domain.entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type Repository } from 'typeorm';

describe('WorkspaceDomainsService', () => {
  const twentyConfigService = {
    get: jest.fn((key: string) => key === 'IS_MHOO_FOUNDATION_ENABLED'),
  } as unknown as TwentyConfigService;
  const domainServerConfigService = {
    getFrontUrl: jest.fn(() => new URL('https://app.mhoo.app')),
  } as unknown as DomainServerConfigService;
  const workspaceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  } as unknown as Repository<WorkspaceEntity>;
  const publicDomainRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<PublicDomainEntity>;

  const service = new WorkspaceDomainsService(
    domainServerConfigService,
    twentyConfigService,
    workspaceRepository,
    publicDomainRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses one configured stable host for every Workspace in Mhoo mode', () => {
    expect(
      service.getWorkspaceUrls({
        subdomain: 'workspace-a',
        customDomain: 'customer.example.com',
        isCustomDomainEnabled: true,
      }),
    ).toEqual({
      customUrl: undefined,
      subdomainUrl: 'https://app.mhoo.app/',
    });
  });

  it('never derives a Workspace from the stable host', async () => {
    await expect(
      service.resolveWorkspaceAndPublicDomain('https://app.mhoo.app'),
    ).resolves.toEqual({
      workspace: undefined,
      publicDomain: null,
      isIsolatedOrigin: false,
    });
    expect(workspaceRepository.findOne).not.toHaveBeenCalled();
  });
});
