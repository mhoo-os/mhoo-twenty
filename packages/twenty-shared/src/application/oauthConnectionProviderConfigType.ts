import { type OAuthProviderTokenRequestContentType } from '@/application/oauthProviderTokenRequestContentType.type';

export type OAuthConnectionProviderConfig = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revokeEndpoint?: string;
  scopes: string[];
  clientIdVariable: string;
  clientSecretVariable: string;
  authorizationParams?: Record<string, string>;
  tokenRequestContentType?: OAuthProviderTokenRequestContentType;
  usePkce?: boolean;
  // Some OAuth providers return the durable external account identifier in
  // the callback rather than in an ID token. The value is selected from this
  // one named query parameter after the signed state is verified.
  callbackHandleQueryParam?: string;
  // OAuth refresh is not completely uniform. This bounded shape covers
  // providers that use a distinct refresh endpoint and omit standard fields,
  // without letting an application provide arbitrary request parameters.
  refreshTokenRequest?: {
    endpoint?: string;
    includeClientSecret?: boolean;
    includeGrantType?: boolean;
  };
};
