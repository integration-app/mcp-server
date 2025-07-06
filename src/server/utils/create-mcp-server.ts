import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import pkg from '../../../package.json';
import { getActionsForAllConnectedApp } from './membrane/get-actions-for-all-connected-app';
import { Action, IntegrationAppClient } from '@integration-app/sdk/dist';
import { MockIntegrationAppClient } from './mocks/mock-integration-app-client';
import { isTestEnvironment } from './constants';
import { zodFromJsonSchema } from './json-schema-to-zod';
import { ZodRawShape } from 'zod';

function addServerTool({
  mcpServer,
  action,
  membrane,
}: {
  mcpServer: McpServer;
  action: Action;
  membrane: IntegrationAppClient;
}) {
  const toolParametersSchema = zodFromJsonSchema(
    action.inputSchema || {
      type: 'object',
      properties: undefined,
    }
  ) as unknown as ZodRawShape;

  const integrationKey = action.integration?.key;
  const integrationName = action.integration?.name;

  if (!integrationKey || !integrationName) {
    return;
  }

  /**
   * Include integration name/key to avoid collisions
   * use underscore to make it easier to tell the integration key fo the tool
   */
  let toolName = `${integrationKey}_${action.key}`;
  let toolDescription = `${integrationName}: ${action.name}`;

  /**
   * Some MCP Clients have a limit of 64 characters for the tool name:
   * server prefix + tool name
   * we'll limit it to 48 to account for the server name prefix
   */
  const maxToolKeyLength = 50;

  toolName =
    toolName.length > maxToolKeyLength ? toolName.substring(0, maxToolKeyLength) : toolName;

  mcpServer.registerTool(
    toolName,
    {
      title: toolDescription,
      description: toolDescription,
      inputSchema: toolParametersSchema,
    },
    async args => {
      const result = await membrane
        .actionInstance({
          autoCreate: true,
          integrationKey,
          parentKey: action.key,
        })
        .run(args);

      return {
        content: [
          {
            type: 'text',
            text: result.output ? JSON.stringify(result.output) : 'No output',
          },
        ],
      };
    }
  );
}

export const createMcpServer = async ({
  userAccessToken,
  integrationKey,
}: {
  userAccessToken: string;
  integrationKey?: string;
}) => {
  const mcpServer = new McpServer({
    name: 'Integration App MCP Server',
    version: pkg.version,
    description: pkg.description,
  });

  let actions: Action[] = [];
  let membrane: IntegrationAppClient;

  if (isTestEnvironment) {
    membrane = new MockIntegrationAppClient(userAccessToken) as any;
  } else {
    membrane = new IntegrationAppClient({ token: userAccessToken });
  }

  /**
   * Get actions for all connected apps on membrane
   *
   * If `integrationKey` is provided, MCP server only return tools for the integration
   */
  actions = await getActionsForAllConnectedApp({ membrane, integrationKey });

  for (const action of actions) {
    try {
      await addServerTool({ mcpServer, action, membrane });
    } catch (error) {
      console.error(`Failed to add server tool for action: ${action.name}`, error);
    }
  }
  console.log(`Added ${actions.length} tools`);

  /**
   * TODO: Add resources to the server
   */

  return { mcpServer };
};
