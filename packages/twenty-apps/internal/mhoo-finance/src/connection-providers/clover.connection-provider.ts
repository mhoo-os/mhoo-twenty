import { defineConnectionProvider } from 'twenty-sdk/define';

import { CLOVER_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// The published v2.37.0 SDK types predate the bounded platform additions in
// this source tree. Keep the declaration strongly typed locally and pass it as
// a variable so the App remains buildable against that exact SDK package.
type ConnectionProviderConfig = Parameters<typeof defineConnectionProvider>[0];

type CloverConnectionProviderConfig = ConnectionProviderConfig & {
  oauth: NonNullable<ConnectionProviderConfig['oauth']> & {
    callbackHandleQueryParam: 'merchant_id';
    refreshTokenRequest: {
      endpoint: 'https://api.clover.com/oauth/v2/refresh';
      includeClientSecret: false;
      includeGrantType: false;
    };
  };
};

const cloverConnectionProvider = {
  universalIdentifier: CLOVER_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  name: 'clover',
  displayName: 'Clover',
  type: 'oauth',
  oauth: {
    authorizationEndpoint: 'https://www.clover.com/oauth/v2/authorize',
    tokenEndpoint: 'https://api.clover.com/oauth/v2/token',
    scopes: [],
    clientIdVariable: 'CLOVER_CLIENT_ID',
    clientSecretVariable: 'CLOVER_CLIENT_SECRET',
    tokenRequestContentType: 'json',
    usePkce: false,
    callbackHandleQueryParam: 'merchant_id',
    refreshTokenRequest: {
      endpoint: 'https://api.clover.com/oauth/v2/refresh',
      includeClientSecret: false,
      includeGrantType: false,
    },
  },
} satisfies CloverConnectionProviderConfig;

export default defineConnectionProvider(cloverConnectionProvider);
