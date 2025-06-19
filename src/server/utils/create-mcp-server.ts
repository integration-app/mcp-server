import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import pkg from '../../../package.json';

export const createMcpServer = () => {
  const mcpServer = new McpServer({
    name: 'Integration App MCP Server',
    version: pkg.version,
    description: pkg.description,
  });

  /**
   * TODO: Add resources to the server
   */

  return { mcpServer };
};
