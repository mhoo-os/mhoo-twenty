import { ConnectionProviderException } from 'src/engine/core-modules/application/connection-provider/connection-provider.exception';
import { extractOAuthCallbackHandle } from 'src/engine/core-modules/application/connection-provider/utils/extract-oauth-callback-handle.util';

describe('extractOAuthCallbackHandle', () => {
  it('returns only the provider-declared callback field', () => {
    expect(
      extractOAuthCallbackHandle({
        callbackQuery: {
          merchant_id: '88TJMM2T52WQ2',
          code: 'authorization-code',
        },
        callbackHandleQueryParam: 'merchant_id',
      }),
    ).toBe('88TJMM2T52WQ2');
  });

  it('does not inspect callback fields when the provider did not opt in', () => {
    expect(
      extractOAuthCallbackHandle({
        callbackQuery: { merchant_id: '88TJMM2T52WQ2' },
        callbackHandleQueryParam: null,
      }),
    ).toBeNull();
  });

  it.each([
    { callbackQuery: {}, reason: 'missing' },
    { callbackQuery: { merchant_id: ['one', 'two'] }, reason: 'repeated' },
    { callbackQuery: { merchant_id: '' }, reason: 'empty' },
    { callbackQuery: { merchant_id: 'x'.repeat(256) }, reason: 'oversized' },
  ])('rejects a $reason callback handle', ({ callbackQuery }) => {
    expect(() =>
      extractOAuthCallbackHandle({
        callbackQuery,
        callbackHandleQueryParam: 'merchant_id',
      }),
    ).toThrow(ConnectionProviderException);
  });
});
