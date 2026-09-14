import { useState } from 'react';

import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Button } from 'twenty-ui/input';
import { Card } from 'twenty-ui/surfaces';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { TextInput } from '@/ui/input/components/TextInput';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import {
  GET_WORKSPACE_CODEX_LB_STATUS,
  SET_WORKSPACE_CODEX_LB_API_KEY,
} from '~/pages/settings/ai/graphql/workspaceCodexLbProvider';

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  margin: 0;
`;

const StyledActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

type WorkspaceStatus = {
  currentWorkspace: {
    id: string;
    codexLbConfigured: boolean;
  };
};

export const SettingsAiWorkspaceCodexLbProvider = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [currentWorkspace, setCurrentWorkspace] = useAtomState(
    currentWorkspaceState,
  );
  const [apiKey, setApiKey] = useState('');
  const { data, refetch } = useQuery<WorkspaceStatus>(
    GET_WORKSPACE_CODEX_LB_STATUS,
  );
  const [setCredential, { loading }] = useMutation(
    SET_WORKSPACE_CODEX_LB_API_KEY,
  );

  const handleSave = async () => {
    if (!apiKey.trim()) return;

    try {
      await setCredential({ variables: { apiKey } });
      setApiKey('');
      await refetch();
      setCurrentWorkspace((latestWorkspace) =>
        latestWorkspace && latestWorkspace.id === currentWorkspace?.id
          ? { ...latestWorkspace, codexLbConfigured: true }
          : latestWorkspace,
      );
      enqueueSuccessSnackBar({ message: t`Workspace AI key saved` });
    } catch {
      enqueueErrorSnackBar({ message: t`Could not save the Workspace AI key` });
    }
  };

  return (
    <Section>
      <H2Title
        title={t`Workspace AI gateway`}
        description={t`This key is used only for AI requests from this Workspace`}
      />
      <Card rounded>
        <StyledContent>
          <StyledHint>
            {data?.currentWorkspace.codexLbConfigured
              ? t`Key configured for this Workspace`
              : t`No key configured for this Workspace`}
          </StyledHint>
          <StyledHint>
            {t`Endpoint: codex-lb.mhoo.app · Models: GPT-5.6 Terra and Luna`}
          </StyledHint>
          <TextInput
            value={apiKey}
            onChange={setApiKey}
            type="password"
            placeholder={t`Enter a new Workspace key`}
            fullWidth
          />
          <StyledActions>
            <Button
              title={t`Save Workspace key`}
              onClick={handleSave}
              disabled={!apiKey.trim() || loading}
            />
          </StyledActions>
        </StyledContent>
      </Card>
    </Section>
  );
};
