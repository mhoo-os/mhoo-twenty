import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

export type WorkspaceCodexLbCredential = {
  apiKey: PlaintextString;
  revision: number;
};

@Injectable()
export class WorkspaceCodexLbCredentialService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {}

  async isConfigured(workspaceId: string): Promise<boolean> {
    const workspace = await this.findCredentialRow(workspaceId);

    return !!workspace?.codexLbEncryptedApiKey;
  }

  async getForWorkspace(
    workspaceId: string,
  ): Promise<WorkspaceCodexLbCredential | null> {
    const workspace = await this.findCredentialRow(workspaceId);

    if (!workspace?.codexLbEncryptedApiKey) {
      return null;
    }

    return {
      apiKey: this.secretEncryptionService.decryptVersionedOrThrow(
        workspace.codexLbEncryptedApiKey,
        { workspaceId },
      ),
      revision: workspace.codexLbCredentialRevision,
    };
  }

  async replaceForWorkspace(
    workspaceId: string,
    apiKey: PlaintextString,
  ): Promise<void> {
    if (!apiKey.trim()) {
      throw new Error('A non-empty codex-lb API key is required');
    }

    const encryptedApiKey = this.secretEncryptionService.encryptVersioned(
      apiKey,
      { workspaceId },
    );
    const result = await this.workspaceRepository
      .createQueryBuilder()
      .update(WorkspaceEntity)
      .set({
        codexLbEncryptedApiKey: encryptedApiKey,
        codexLbCredentialRevision: () => '"codexLbCredentialRevision" + 1',
      })
      .where('id = :workspaceId', { workspaceId })
      .execute();

    if (result.affected !== 1) {
      throw new Error('Workspace not found');
    }
  }

  async removeForWorkspace(workspaceId: string): Promise<void> {
    const result = await this.workspaceRepository
      .createQueryBuilder()
      .update(WorkspaceEntity)
      .set({
        codexLbEncryptedApiKey: null,
        codexLbCredentialRevision: () => '"codexLbCredentialRevision" + 1',
      })
      .where('id = :workspaceId', { workspaceId })
      .execute();

    if (result.affected !== 1) {
      throw new Error('Workspace not found');
    }
  }

  private findCredentialRow(
    workspaceId: string,
  ): Promise<WorkspaceEntity | null> {
    return this.workspaceRepository
      .createQueryBuilder('workspace')
      .addSelect('workspace.codexLbEncryptedApiKey')
      .where('workspace.id = :workspaceId', { workspaceId })
      .getOne();
  }
}
