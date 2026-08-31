import { defineConnectionProvider } from 'twenty-sdk/define';

import { CLOVER_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineConnectionProvider({
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
  },
});
