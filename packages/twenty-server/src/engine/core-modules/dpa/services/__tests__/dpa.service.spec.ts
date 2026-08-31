import { BadRequestException } from '@nestjs/common';
import { type Repository } from 'typeorm';

import { type ApplicationService } from 'src/engine/core-modules/application/application.service';
import { type DpaAgreementEntity } from 'src/engine/core-modules/dpa/entities/dpa-agreement.entity';
import { type DpaRegionService } from 'src/engine/core-modules/dpa/services/dpa-region.service';
import { DpaService } from 'src/engine/core-modules/dpa/services/dpa.service';
import { type FileStorageService } from 'src/engine/core-modules/file-storage/services/file-storage.service';
import { type FileUrlService } from 'src/engine/core-modules/file/file-url/file-url.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

jest.mock('src/engine/core-modules/dpa/pdf/render-dpa-to-pdf.util', () => ({
  renderDpaToPdfBuffer: jest.fn(),
}));

describe('DpaService', () => {
  it("does not expose Twenty's DPA when the Mhoo foundation is enabled", () => {
    const twentyConfigService = {
      get: jest.fn().mockReturnValue(true),
    } as unknown as TwentyConfigService;

    const service = new DpaService(
      {} as Repository<DpaAgreementEntity>,
      {} as DpaRegionService,
      {} as FileStorageService,
      {} as FileUrlService,
      {} as ApplicationService,
      twentyConfigService,
    );

    expect(() =>
      service.getPreviewForWorkspace({ id: 'workspace-id' }),
    ).toThrow(BadRequestException);
  });
});
