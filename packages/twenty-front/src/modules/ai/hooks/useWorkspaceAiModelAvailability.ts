import { isAutoSelectModelId } from 'twenty-shared/utils';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useWorkspaceAiModels } from '@/ai/hooks/useWorkspaceAiModels';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useWorkspaceAiModelAvailability = () => {
  const aiModels = useWorkspaceAiModels();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  const useRecommendedModels = currentWorkspace?.useRecommendedModels ?? true;
  const enabledAiModelIds = new Set(currentWorkspace?.enabledAiModelIds ?? []);

  const realModels = aiModels.filter(
    (model) => !isAutoSelectModelId(model.modelId) && !model.isDeprecated,
  );

  const enabledModels = useRecommendedModels
    ? realModels.filter((model) => model.isRecommended === true)
    : realModels.filter((model) => enabledAiModelIds.has(model.modelId));

  return {
    enabledModels,
    realModels,
    useRecommendedModels,
  };
};
