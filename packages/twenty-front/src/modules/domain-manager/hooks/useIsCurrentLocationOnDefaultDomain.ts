import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { isMhooFoundationEnabledState } from '@/client-config/states/isMhooFoundationEnabledState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useReadDefaultDomainFromConfiguration } from '@/domain-manager/hooks/useReadDefaultDomainFromConfiguration';

export const useIsCurrentLocationOnDefaultDomain = () => {
  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const isMhooFoundationEnabled = useAtomStateValue(
    isMhooFoundationEnabledState,
  );
  const { defaultDomain } = useReadDefaultDomainFromConfiguration();
  const isDefaultDomain =
    isMhooFoundationEnabled ||
    !isMultiWorkspaceEnabled ||
    window.location.hostname === defaultDomain;

  return {
    isDefaultDomain,
  };
};
