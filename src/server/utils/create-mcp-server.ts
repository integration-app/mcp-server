import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const createMcpServer = () => {
  const mcpServer = new McpServer({
    name: `Integration App MCP Server`,
    version: '1.0.0',
    description: `MCP server for all Integration App connections`,
  });

  /**
   * TODO: Add tools to the server
   */

  return { mcpServer };
};
