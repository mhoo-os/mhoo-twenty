import { CustomDomainManagerService } from 'src/engine/core-modules/domain/custom-domain-manager/services/custom-domain-manager.service';
import { WorkspaceExceptionCode } from 'src/engine/core-modules/workspace/workspace.exception';

describe('CustomDomainManagerService', () => {
  const dnsManagerService = {
    registerHostname: jest.fn(),
    updateHostname: jest.fn(),
    getHostnameWithRecords: jest.fn(),
    isHostnameWorking: jest.fn(),
  };

  const service = new CustomDomainManagerService(
    { findOne: jest.fn() } as any,
    { findOneBy: jest.fn() } as any,
    { hasEntitlement: jest.fn() } as any,
    dnsManagerService as any,
    { createContext: jest.fn() } as any,
    { get: jest.fn().mockReturnValue(true) } as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects custom-domain registration before any DNS provider call in Mhoo mode', async () => {
    await expect(
      service.setCustomDomain(
        { id: 'workspace-a', customDomain: null } as any,
        'customer.example.com',
      ),
    ).rejects.toMatchObject({
      code: WorkspaceExceptionCode.WORKSPACE_CUSTOM_DOMAIN_DISABLED,
    });

    expect(dnsManagerService.registerHostname).not.toHaveBeenCalled();
    expect(dnsManagerService.updateHostname).not.toHaveBeenCalled();
  });

  it('rejects custom-domain validation before DNS lookup in Mhoo mode', async () => {
    await expect(
      service.checkCustomDomainValidRecords({
        id: 'workspace-a',
        customDomain: 'customer.example.com',
      } as any),
    ).rejects.toMatchObject({
      code: WorkspaceExceptionCode.WORKSPACE_CUSTOM_DOMAIN_DISABLED,
    });

    expect(dnsManagerService.getHostnameWithRecords).not.toHaveBeenCalled();
    expect(dnsManagerService.isHostnameWorking).not.toHaveBeenCalled();
  });
});
