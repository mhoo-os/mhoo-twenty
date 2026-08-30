import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { USAGE_ROUTE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { usageRouteHandler } from 'src/logic-functions/usage-route-handler';

const handler = async (event: RoutePayload) =>
  usageRouteHandler(event.queryStringParameters?.window);

export default defineLogicFunction({
  universalIdentifier: USAGE_ROUTE_UNIVERSAL_IDENTIFIER,
  name: 'codex-lb-global-usage-route',
  description:
    'Owner-authorized server route for aggregate Codex-LB Workspace usage.',
  timeoutSeconds: 15,
  handler,
  httpRouteTriggerSettings: {
    path: '/codex-lb/usage',
    httpMethod: 'GET',
    isAuthRequired: true,
  },
});
