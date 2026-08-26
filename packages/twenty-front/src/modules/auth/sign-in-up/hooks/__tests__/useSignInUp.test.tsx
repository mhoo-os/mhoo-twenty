/** @jest-environment-options {"url":"https://app.mhoo.app/welcome"} */

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
import { isMhooFoundationEnabledState } from '@/client-config/states/isMhooFoundationEnabledState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
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

const renderSignInUp = (initialEntry = '/welcome') =>
  renderHook(() => useSignInUp(form), {
    wrapper: ({ children }) => (
      <TestWrapper initialEntry={initialEntry}>{children}</TestWrapper>
    ),
  });

const configureLocationAndMode = ({
  isMhooFoundationEnabled,
  isMultiWorkspaceEnabled,
  mode,
  frontDomain,
  defaultSubdomain,
}: {
  isMhooFoundationEnabled: boolean;
  isMultiWorkspaceEnabled: boolean;
  mode: SignInUpMode;
  frontDomain: string;
  defaultSubdomain: string;
}) => {
  jotaiStore.set(isMhooFoundationEnabledState.atom, isMhooFoundationEnabled);
  jotaiStore.set(isMultiWorkspaceEnabledState.atom, isMultiWorkspaceEnabled);
  jotaiStore.set(domainConfigurationState.atom, {
    defaultSubdomain,
    frontDomain,
    publicFunctionDomain: undefined,
  });
  jotaiStore.set(signInUpModeState.atom, mode);
  jotaiStore.set(signInUpStepState.atom, SignInUpStep.Password);
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

describe('useSignInUp operation selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetJotaiStore();
    (useCaptcha as jest.Mock).mockReturnValue({ isCaptchaReady: true });
  });

  it('selects global signup through the real Foundation stable-host wiring', async () => {
    expect(window.location.hostname).toBe('app.mhoo.app');
    configureLocationAndMode({
      defaultSubdomain: 'app',
      frontDomain: 'app.mhoo.app',
      isMhooFoundationEnabled: true,
      isMultiWorkspaceEnabled: true,
      mode: SignInUpMode.SignUp,
    });
    const { result } = renderSignInUp();

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignUpWithCredentials).toHaveBeenCalledWith(
      'person@example.com',
      'Password123!',
      'captcha-token',
    );
    expect(mockSignUpWithCredentialsInWorkspace).not.toHaveBeenCalled();
  });

  it('keeps Foundation stable-host sign-in on the Candidate-base workspace operation', async () => {
    configureLocationAndMode({
      defaultSubdomain: 'app',
      frontDomain: 'app.mhoo.app',
      isMhooFoundationEnabled: true,
      isMultiWorkspaceEnabled: true,
      mode: SignInUpMode.SignIn,
    });
    const { result } = renderSignInUp();

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignInWithCredentialsInWorkspace).toHaveBeenCalledWith(
      'person@example.com',
      'Password123!',
      'captcha-token',
    );
    expect(mockSignInWithCredentials).not.toHaveBeenCalled();
  });

  it('keeps Foundation invitation signup on the workspace operation', async () => {
    configureLocationAndMode({
      defaultSubdomain: 'app',
      frontDomain: 'app.mhoo.app',
      isMhooFoundationEnabled: true,
      isMultiWorkspaceEnabled: true,
      mode: SignInUpMode.SignUp,
    });
    const { result } = renderSignInUp('/invite/verified-invite-hash');

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignUpWithCredentials).not.toHaveBeenCalled();
    expect(mockSignUpWithCredentialsInWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceInviteHash: 'verified-invite-hash' }),
    );
  });

  it('keeps Foundation personal-invite signup on the workspace operation', async () => {
    configureLocationAndMode({
      defaultSubdomain: 'app',
      frontDomain: 'app.mhoo.app',
      isMhooFoundationEnabled: true,
      isMultiWorkspaceEnabled: true,
      mode: SignInUpMode.SignUp,
    });
    const { result } = renderSignInUp(
      '/invite/verified-invite-hash?inviteToken=verified-personal-invite-token',
    );

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignUpWithCredentials).not.toHaveBeenCalled();
    expect(mockSignUpWithCredentialsInWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceInviteHash: 'verified-invite-hash',
        workspacePersonalInviteToken: 'verified-personal-invite-token',
      }),
    );
  });

  it('preserves non-Foundation single-workspace global signup', async () => {
    configureLocationAndMode({
      defaultSubdomain: 'app',
      frontDomain: 'mhoo.app',
      isMhooFoundationEnabled: false,
      isMultiWorkspaceEnabled: false,
      mode: SignInUpMode.SignUp,
    });
    const { result } = renderSignInUp();

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignUpWithCredentials).toHaveBeenCalled();
    expect(mockSignUpWithCredentialsInWorkspace).not.toHaveBeenCalled();
  });

  it('preserves non-Foundation multi-workspace global-domain signup', async () => {
    configureLocationAndMode({
      defaultSubdomain: 'app',
      frontDomain: 'mhoo.app',
      isMhooFoundationEnabled: false,
      isMultiWorkspaceEnabled: true,
      mode: SignInUpMode.SignUp,
    });
    const { result } = renderSignInUp();

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignUpWithCredentials).toHaveBeenCalled();
    expect(mockSignUpWithCredentialsInWorkspace).not.toHaveBeenCalled();
  });

  it('preserves non-Foundation multi-workspace workspace-domain signup', async () => {
    configureLocationAndMode({
      defaultSubdomain: 'app',
      frontDomain: 'app.mhoo.app',
      isMhooFoundationEnabled: false,
      isMultiWorkspaceEnabled: true,
      mode: SignInUpMode.SignUp,
    });
    const { result } = renderSignInUp();

    await submitCredentials(result.current.submitCredentials);

    expect(mockSignUpWithCredentials).not.toHaveBeenCalled();
    expect(mockSignUpWithCredentialsInWorkspace).toHaveBeenCalled();
  });
});
