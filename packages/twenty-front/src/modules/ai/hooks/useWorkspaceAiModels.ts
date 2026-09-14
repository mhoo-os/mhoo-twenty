import { type ClientAiModelConfig } from '~/generated-metadata/graphql';
import {
  AUTO_SELECT_FAST_MODEL_ID,
  AUTO_SELECT_SMART_MODEL_ID,
} from 'twenty-shared/constants';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { aiModelsState } from '@/client-config/states/aiModelsState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const WORKSPACE_CODEX_LB_MODELS: ClientAiModelConfig[] = [
  {
    modelId: 'codex-lb/gpt-5.6-terra',
    label: 'GPT-5.6 Terra',
    providerName: 'codex-lb',
    providerLabel: 'Workspace AI gateway',
    sdkPackage: '@ai-sdk/openai-compatible',
    isRecommended: true,
  },
  {
    modelId: 'codex-lb/gpt-5.6-luna',
    label: 'GPT-5.6 Luna',
    providerName: 'codex-lb',
    providerLabel: 'Workspace AI gateway',
    sdkPackage: '@ai-sdk/openai-compatible',
    isRecommended: true,
  },
];

export const useWorkspaceAiModels = (): ClientAiModelConfig[] => {
  const aiModels = useAtomStateValue(aiModelsState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  // The Workspace comes from the authenticated user query, never client config.
  const isThisWorkspaceConfigured = currentWorkspace?.codexLbConfigured;

  if (!isThisWorkspaceConfigured) {
    return aiModels;
  }

  const scopedModels = aiModels.map((model) =>
    model.modelId === AUTO_SELECT_FAST_MODEL_ID ||
    model.modelId === AUTO_SELECT_SMART_MODEL_ID
      ? {
          ...model,
          label: 'GPT-5.6 Terra',
          providerName: 'codex-lb',
          providerLabel: 'Workspace AI gateway',
        }
      : model,
  );

  const missingAutoModels = [
    AUTO_SELECT_SMART_MODEL_ID,
    AUTO_SELECT_FAST_MODEL_ID,
  ]
    .filter((modelId) => !scopedModels.some((model) => model.modelId === modelId))
    .map((modelId) => ({
      modelId,
      label: 'GPT-5.6 Terra',
      providerName: 'codex-lb',
      providerLabel: 'Workspace AI gateway',
      sdkPackage: '@ai-sdk/openai-compatible',
    }));

  return [...missingAutoModels, ...scopedModels, ...WORKSPACE_CODEX_LB_MODELS];
};
