import { FieldType, defineApplication } from 'twenty-sdk/define';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Codex LB Usage',
  description:
    'Owner-only aggregate Codex usage across Twenty Workspaces backed by Codex-LB.',
  logo: 'public/logo.svg',
  author: 'Mhoo',
  category: 'Data',
  serverVariables: {
    CODEX_LB_USAGE_BRIDGE_BASE_URL: {
      description:
        'Internal Codex-LB origin used by the server-side App function, for example http://mhoo-codex-lb-server-1:2455.',
      isSecret: false,
      isRequired: true,
      type: FieldType.TEXT,
    },
    CODEX_LB_USAGE_BRIDGE_TOKEN: {
      description:
        'Dedicated read-only service token shared only with the Codex-LB Twenty usage bridge.',
      isSecret: true,
      isRequired: true,
      type: FieldType.TEXT,
    },
  },
});
