import { defineApplication } from 'twenty-sdk/define';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Mhoo Finance',
  description:
    'Read-only provider facts for finance workflows through Twenty Connections and Workspace-authenticated tools.',
  serverVariables: {
    CLOVER_CLIENT_ID: {
      description:
        'Clover App ID for the reviewed read-only web application registration.',
      isSecret: false,
      isRequired: true,
    },
    CLOVER_CLIENT_SECRET: {
      description:
        'Clover App Secret for the reviewed read-only web application registration.',
      isSecret: true,
      isRequired: true,
    },
  },
});
