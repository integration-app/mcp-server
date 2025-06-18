import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

const mcpServer = new McpServer({
  name: `Integration App MCP Server`,
  version: '1.0.0',
  description: `MCP server for all Integration App connections`,
});

/**
 * TODO: Add tools to the server
 */

export { mcpServer };
