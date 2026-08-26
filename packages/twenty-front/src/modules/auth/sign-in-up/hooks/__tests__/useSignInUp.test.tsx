import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { act, renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SOURCE_LOCALE } from 'twenty-shared/translations';

import { useSignInUp } from '@/auth/sign-in-up/hooks/useSignInUp';
import { type Form } from '@/auth/sign-in-up/hooks/useSignInUpForm';
import { signInUpModeState } from '@/auth/states/signInUpModeState';
import {
  SignInUpStep,
  signInUpStepState,
} from '@/auth/states/signInUpStepState';
import { SignInUpMode } from '@/auth/types/signInUpMode';
import { useCaptcha } from '@/client-config/hooks/useCaptcha';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { getIsCurrentLocationOnAWorkspace } from '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

const mockSignInWithCredentials = jest.fn();
const mockSignInWithCredentialsInWorkspace = jest.fn();
const mockSignUpWithCredentials = jest.fn();
const mockSignUpWithCredentialsInWorkspace = jest.fn();
const mockCheckUserExistsQuery = jest.fn();
const mockEnqueueErrorSnackBar = jest.fn();
const mockReadCaptchaToken = jest.fn(() => 'captcha-token');
const mockBuildSearchParamsFromUrlSyncedStates = jest.fn(async () => ({}));
let mockIsOnAWorkspace = false;

jest.mock('@/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    checkUserExists: { checkUserExistsQuery: mockCheckUserExistsQuery },
    signInWithCredentials: mockSignInWithCredentials,
    signInWithCredentialsInWorkspace: mockSignInWithCredentialsInWorkspace,
    signUpWithCredentials: mockSignUpWithCredentials,
    signUpWithCredentialsInWorkspace: mockSignUpWithCredentialsInWorkspace,
  }),
}));

jest.mock('@/captcha/hooks/useReadCaptchaToken', () => ({
  useReadCaptchaToken: () => ({ readCaptchaToken: mockReadCaptchaToken }),
}));

jest.mock('@/client-config/hooks/useCaptcha');

jest.mock(
  '@/domain-manager/hooks/useBuildSearchParamsFromUrlSyncedStates',
  () => ({
    useBuildSearchParamsFromUrlSyncedStates: () => ({
      buildSearchParamsFromUrlSyncedStates:
        mockBuildSearchParamsFromUrlSyncedStates,
    }),
  }),
);

jest.mock('@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace', () => ({
  ...jest.requireActual(
    '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace',
  ),
  useIsCurrentLocationOnAWorkspace: () => ({
    isOnAWorkspace: mockIsOnAWorkspace,
  }),
}));

jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar', () => ({
  useSnackBar: () => ({ enqueueErrorSnackBar: mockEnqueueErrorSnackBar }),
}));

dynamicActivate(SOURCE_LOCALE);

const form = {
  getValues: jest.fn(),
} as Pick<UseFormReturn<Form>, 'getValues'> as UseFormReturn<Form>;

const TestWrapper = ({
  children,
  initialEntry,
}: {
  children: ReactNode;
  initialEntry: string;
}) => (
  <MemoryRouter initialEntries={[initialEntry]}>
    <JotaiProvider store={jotaiStore}>
      <I18nProvider i18n={i18n}>
        <Routes>
          <Route path="/invite/:workspaceInviteHash" element={children} />
          <Route path="*" element={children} />
        </Routes>
      </I18nProvider>
    </JotaiProvider>
  </MemoryRouter>
);

const renderSignUpHook = (initialEntry = '/welcome') =>
  renderHook(() => useSignInUp(form), {
    wrapper: ({ children }) => (
      <TestWrapper initialEntry={initialEntry}>{children}</TestWrapper>
    ),
  });

const setSignUpState = ({
  isMultiWorkspaceEnabled,
  isOnAWorkspace,
}: {
  isMultiWorkspaceEnabled: boolean;
  isOnAWorkspace: boolean;
}) => {
  jotaiStore.set(isMultiWorkspaceEnabledState.atom, isMultiWorkspaceEnabled);
  jotaiStore.set(signInUpModeState.atom, SignInUpMode.SignUp);
  jotaiStore.set(signInUpStepState.atom, SignInUpStep.Password);
  mockIsOnAWorkspace = isOnAWorkspace;
};

const submitCredentials = async (
  submit: ReturnType<typeof useSignInUp>['submitCredentials'],
) => {
  await act(async () => {
    await submit({
      captchaToken: '',
      email: 'person@example.com',
      exist: false,
      password: 'Password123!',
    });
  });
};

describe('useSignInUp signup operation selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetJotaiStore();
    mockIsOnAWorkspace = false;
    (useCaptcha as jest.Mock).mockReturnValue({ isCaptchaReady: true });
  });

  it('keeps Foundation stable-host signup global despite a non-matching derived domain', async () => {
    expect(
      getIsCurrentLocationOnAWorkspace({
        defaultDomain: 'app.app.mhoo.app',
        hostname: 'app.mhoo.app',
        isMhooFoundationEnabled: true,
        isMultiWorkspaceEnabled: true,
      }),
    ).toBe(false);

    setSignUpState({
      isMultiWorkspaceEnabled: true,
      isOnAWorkspace: false,
    });
    const { result } = renderSignUpHook();

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignUpWithCredentials).toHaveBeenCalledWith(
      'person@example.com',
      'Password123!',
      'captcha-token',
    );
    expect(mockSignUpWithCredentialsInWorkspace).not.toHaveBeenCalled();
  });

  it('preserves the invitation signup operation without hostname-derived workspace identity', async () => {
    setSignUpState({
      isMultiWorkspaceEnabled: true,
      isOnAWorkspace: false,
    });
    const { result } = renderSignUpHook('/invite/verified-invite-hash');

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignUpWithCredentials).not.toHaveBeenCalled();
    expect(mockSignUpWithCredentialsInWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'person@example.com',
        password: 'Password123!',
        workspaceInviteHash: 'verified-invite-hash',
      }),
    );
  });

  it('preserves non-Foundation multi-workspace scoped signup selection', async () => {
    setSignUpState({
      isMultiWorkspaceEnabled: true,
      isOnAWorkspace: true,
    });
    const { result } = renderSignUpHook();

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignUpWithCredentials).not.toHaveBeenCalled();
    expect(mockSignUpWithCredentialsInWorkspace).toHaveBeenCalled();
  });

  it('preserves single-workspace signup selection', async () => {
    setSignUpState({
      isMultiWorkspaceEnabled: false,
      isOnAWorkspace: true,
    });
    const { result } = renderSignUpHook();

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignUpWithCredentials).toHaveBeenCalled();
    expect(mockSignUpWithCredentialsInWorkspace).not.toHaveBeenCalled();
  });
});
