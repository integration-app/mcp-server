import { Action } from '@integration-app/sdk/dist';

const mockActions = [
  {
    id: 'test_action_id',
    key: 'create_event',
    name: 'Create Event',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Create a new event',
        },
      },
    },
    integration: {
      id: 'google-calendar',
      key: 'google-calendar',
      name: 'Google Calendar',
      logoUri: 'https://example.com/logo.png',
      baseUri: 'https://example.com',
    },
  },
  {
    id: 'send-email',
    key: 'send_email',
    name: 'Send Email',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Test message',
        },
      },
    },
    integration: {
      id: 'gmail',
      key: 'gmail',
      name: 'Gmail',
      logoUri: 'https://example.com/logo.png',
      baseUri: 'https://example.com',
    },
  },
];

// Mock IntegrationAppClient for test environment
export class MockIntegrationAppClient {
  constructor(private token: string) {}

  actionInstance({ autoCreate, integrationKey, parentKey }: any) {
    return {
      run: async (args: any) => ({
        output: 'You passed in' + JSON.stringify(args),
      }),
    };
  }

  actions = {
    find: async ({ integrationId, cursor }: any) => ({
      items: mockActions.filter(action => action.integration.id === integrationId),
      cursor: undefined,
    }),
  };

  connections = {
    find: async (params: any) => {
      const allConnections = [
        {
          id: '1',
          integration: {
            id: 'google-calendar',
            key: 'google-calendar',
          },
        },
        {
          id: '2',
          integration: {
            id: 'gmail',
            key: 'gmail',
          },
        },
      ];

      // Filter by integrationKey if provided
      const filteredConnections = params.integrationKey
        ? allConnections.filter(connection => connection.integration.key === params.integrationKey)
        : allConnections;

      return {
        items: filteredConnections,
        cursor: undefined,
      };
    },
  };
}
