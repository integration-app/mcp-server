import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import pkg from '../../../package.json';

export const createMcpServer = () => {
  const mcpServer = new McpServer({
    name: pkg.name,
    version: pkg.version,
    description: `MCP server for all Integration App connections`,
  });

  /**
   * TODO: Add tools to the server
   */

  return { mcpServer };
};
