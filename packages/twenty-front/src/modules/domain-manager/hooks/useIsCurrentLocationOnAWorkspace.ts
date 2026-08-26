import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { isMhooFoundationEnabledState } from '@/client-config/states/isMhooFoundationEnabledState';
import { useReadDefaultDomainFromConfiguration } from '@/domain-manager/hooks/useReadDefaultDomainFromConfiguration';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';

export const getIsCurrentLocationOnAWorkspace = ({
  defaultDomain,
  hostname,
  isMhooFoundationEnabled,
  isMultiWorkspaceEnabled,
}: {
  defaultDomain: string;
  hostname: string;
  isMhooFoundationEnabled: boolean;
  isMultiWorkspaceEnabled: boolean;
}) =>
  !isMultiWorkspaceEnabled ||
  (!isMhooFoundationEnabled && hostname !== defaultDomain);

export const useIsCurrentLocationOnAWorkspace = () => {
  const { defaultDomain } = useReadDefaultDomainFromConfiguration();

  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const isMhooFoundationEnabled = useAtomStateValue(
    isMhooFoundationEnabledState,
  );
  const domainConfiguration = useAtomStateValue(domainConfigurationState);

  if (
    isMultiWorkspaceEnabled &&
    (!isDefined(domainConfiguration.frontDomain) ||
      !isDefined(domainConfiguration.defaultSubdomain))
  ) {
    throw new Error('frontDomain and defaultSubdomain are required');
  }

  const isOnAWorkspace = getIsCurrentLocationOnAWorkspace({
    defaultDomain,
    hostname: window.location.hostname,
    isMhooFoundationEnabled,
    isMultiWorkspaceEnabled,
  });

  return {
    isOnAWorkspace,
  };
};
