import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Action, IntegrationAppClient } from '@integration-app/sdk';
import { zodFromJsonSchema } from '../json-schema-to-zod';
import { ZodRawShape } from 'zod';

export async function addServerTool({
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

  mcpServer.tool(toolName, toolDescription, toolParametersSchema, async args => {
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
  });
}
