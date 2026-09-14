import { gql } from '@apollo/client';

export const GET_WORKSPACE_CODEX_LB_STATUS = gql`
  query GetWorkspaceCodexLbStatus {
    currentWorkspace {
      id
      codexLbConfigured
    }
  }
`;

export const SET_WORKSPACE_CODEX_LB_API_KEY = gql`
  mutation SetWorkspaceCodexLbApiKey($apiKey: String!) {
    setWorkspaceCodexLbApiKey(apiKey: $apiKey)
  }
`;
