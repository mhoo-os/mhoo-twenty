import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceService } from 'src/engine/core-modules/workspace/services/workspace.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

describe('WorkspaceService > Mhoo foundation hostname boundary', () => {
  it.each([
    { subdomain: 'customer-a' },
    { customDomain: 'customer.example.com' },
    { customDomain: null },
  ])('rejects hostname mutation from Workspace settings', async (hostname) => {
    const service = Object.create(
      WorkspaceService.prototype,
    ) as WorkspaceService;

    Object.assign(service, {
      workspaceRepository: {
        findOneBy: jest.fn().mockResolvedValue({
          id: 'workspace-id',
        } as WorkspaceEntity),
      },
      twentyConfigService: {
        get: jest.fn((key: string) => key === 'IS_MHOO_FOUNDATION_ENABLED'),
      } as unknown as TwentyConfigService,
    });

    await expect(
      service.updateWorkspaceById({
        payload: { id: 'workspace-id', ...hostname },
        apiKey: undefined,
      }),
    ).rejects.toThrow(
      'Workspace hostname settings are unavailable in Mhoo foundation mode',
    );
  });
});
