/** @jest-environment-options {"url":"https://app.mhoo.app/objects/companies"} */

import { renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useIsLogged } from '@/auth/hooks/useIsLogged';
import { isMhooFoundationEnabledState } from '@/client-config/states/isMhooFoundationEnabledState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { useDefaultHomePagePath } from '@/navigation/hooks/useDefaultHomePagePath';
import { useOnboardingStatus } from '@/onboarding/hooks/useOnboardingStatus';
import { useIsWorkspaceActivationStatusEqualsTo } from '@/workspace/hooks/useIsWorkspaceActivationStatusEqualsTo';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { usePageChangeEffectNavigateLocation } from '~/hooks/usePageChangeEffectNavigateLocation';
import { OnboardingStatus } from '~/generated-metadata/graphql';

jest.mock('@/auth/hooks/useIsLogged');
jest.mock('@/navigation/hooks/useDefaultHomePagePath');
jest.mock('@/onboarding/hooks/useOnboardingStatus');
jest.mock('@/workspace/hooks/useIsWorkspaceActivationStatusEqualsTo');
jest.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: undefined, loading: false }),
}));

const TestWrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/objects/companies']}>
    <JotaiProvider store={jotaiStore}>{children}</JotaiProvider>
  </MemoryRouter>
);

describe('usePageChangeEffectNavigateLocation in Foundation stable-host mode', () => {
  beforeEach(() => {
    resetJotaiStore();
    jest.mocked(useIsLogged).mockReturnValue(true);
    jest.mocked(useDefaultHomePagePath).mockReturnValue({
      defaultHomePagePath: '/objects/companies',
    });
    jest
      .mocked(useOnboardingStatus)
      .mockReturnValue(OnboardingStatus.COMPLETED);
    jest.mocked(useIsWorkspaceActivationStatusEqualsTo).mockReturnValue(false);
    jotaiStore.set(isMhooFoundationEnabledState.atom, true);
    jotaiStore.set(isMultiWorkspaceEnabledState.atom, true);
    jotaiStore.set(domainConfigurationState.atom, {
      defaultSubdomain: 'app',
      frontDomain: 'app.mhoo.app',
      publicFunctionDomain: undefined,
    });
    jotaiStore.set(currentWorkspaceState.atom, {
      id: 'workspace-id',
    } as never);
  });

  it('does not redirect an authenticated Foundation stable-host request as global signup scope', () => {
    const { result } = renderHook(() => usePageChangeEffectNavigateLocation(), {
      wrapper: TestWrapper,
    });

    expect(result.current).toBeUndefined();
  });
});
