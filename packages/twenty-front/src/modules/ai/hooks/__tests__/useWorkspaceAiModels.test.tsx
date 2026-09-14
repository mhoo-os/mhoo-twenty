import { act, renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';

import { useWorkspaceAiModels } from '@/ai/hooks/useWorkspaceAiModels';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { aiModelsState } from '@/client-config/states/aiModelsState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';

describe('useWorkspaceAiModels', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetJotaiStore();
  });

  it('does not carry codex-lb models into another Workspace', () => {
    const { result } = renderHook(
      () => {
        const setCurrentWorkspace = useSetAtomState(currentWorkspaceState);
        const setAiModels = useSetAtomState(aiModelsState);

        return {
          models: useWorkspaceAiModels(),
          setCurrentWorkspace,
          setAiModels,
        };
      },
      {
        wrapper: ({ children }) => (
          <JotaiProvider store={jotaiStore}>{children}</JotaiProvider>
        ),
      },
    );

    act(() => {
      result.current.setAiModels([]);
      result.current.setCurrentWorkspace({
        id: 'workspace-a',
        codexLbConfigured: true,
      } as never);
    });

    expect(result.current.models.map((model) => model.modelId)).toEqual([
      'default-smart-model',
      'default-fast-model',
      'codex-lb/gpt-5.6-terra',
      'codex-lb/gpt-5.6-luna',
    ]);

    act(() => {
      result.current.setCurrentWorkspace({
        id: 'workspace-b',
        codexLbConfigured: false,
      } as never);
    });

    expect(result.current.models).toEqual([]);
  });
});
