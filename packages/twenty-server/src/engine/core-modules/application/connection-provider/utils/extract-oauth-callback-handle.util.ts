import { ConnectionProviderExceptionCode } from 'src/engine/core-modules/application/connection-provider/connection-provider-exception-code.enum';
import { ConnectionProviderException } from 'src/engine/core-modules/application/connection-provider/connection-provider.exception';

const MAX_CALLBACK_HANDLE_LENGTH = 255;

export const extractOAuthCallbackHandle = ({
  callbackQuery,
  callbackHandleQueryParam,
}: {
  callbackQuery: Record<string, string | string[] | undefined>;
  callbackHandleQueryParam: string | null | undefined;
}): string | null => {
  if (!callbackHandleQueryParam) {
    return null;
  }

  const value = callbackQuery[callbackHandleQueryParam];

  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_CALLBACK_HANDLE_LENGTH
  ) {
    throw new ConnectionProviderException(
      `OAuth callback is missing a valid ${callbackHandleQueryParam} parameter`,
      ConnectionProviderExceptionCode.INVALID_REQUEST,
    );
  }

  return value;
};
