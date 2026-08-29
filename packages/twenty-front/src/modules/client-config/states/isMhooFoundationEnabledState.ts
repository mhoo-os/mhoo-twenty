import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const isMhooFoundationEnabledState = createAtomState<boolean>({
  key: 'isMhooFoundationEnabled',
  defaultValue: false,
});
