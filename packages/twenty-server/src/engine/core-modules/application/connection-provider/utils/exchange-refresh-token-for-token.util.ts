import { type OAuthProviderTokenRequestContentType } from 'twenty-shared/application';

import { type TokenExchangeResponse } from 'src/engine/core-modules/application/connection-provider/types/token-exchange-response.type';
import { postOAuthTokenRequest } from 'src/engine/core-modules/application/connection-provider/utils/post-oauth-token-request.util';

type FetchFn = typeof globalThis.fetch;

export const exchangeRefreshTokenForToken = (args: {
  fetchFn: FetchFn;
  tokenEndpoint: string;
  contentType: OAuthProviderTokenRequestContentType;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  includeClientSecret?: boolean;
  includeGrantType?: boolean;
}): Promise<TokenExchangeResponse> => {
  const params: Record<string, string> = {
    refresh_token: args.refreshToken,
    client_id: args.clientId,
  };

  if (args.includeGrantType ?? true) {
    params.grant_type = 'refresh_token';
  }

  if (args.includeClientSecret ?? true) {
    params.client_secret = args.clientSecret;
  }

  return postOAuthTokenRequest({
    fetchFn: args.fetchFn,
    tokenEndpoint: args.tokenEndpoint,
    contentType: args.contentType,
    params,
  });
};
