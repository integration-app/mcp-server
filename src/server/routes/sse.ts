import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { IntegrationAppClient } from '@integration-app/sdk';
import { addServerTool } from '../utils/tools/add-server-tool';
import { getActionsForAllConnectedApp } from '../utils/tools/get-actions-for-all-connected-app';
import { createMcpServer } from '../utils/create-mcp-server';

export const sseRouter = express.Router();

const transports: Map<string, SSEServerTransport> = new Map<string, SSEServerTransport>();

sseRouter.get('/', async (req, res) => {
  const token = req.token;

  /**
   * If integrationKey is provided, MCP server only return tools for the integration
   */
  const integrationKey = req.query.integrationKey as string | undefined;

  if (!token) {
    console.log('SSE request missing token');
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  const transport = new SSEServerTransport('/sse/messages', res);
  transports.set(transport.sessionId, transport);

  res.on('close', () => {
    transports.delete(transport.sessionId);
    console.error(`Transport closed for session ${transport.sessionId}`);
  });

  const { mcpServer } = createMcpServer();

  try {
    const membrane = new IntegrationAppClient({
      token: token,
    });

    const actions = await getActionsForAllConnectedApp({
      membrane,
      integrationKey,
    });

    for (const action of actions) {
      await addServerTool({
        mcpServer,
        action,
        membrane,
      });
    }

    await mcpServer.connect(transport);
  } catch (error) {
    console.error('Error in SSE endpoint:', error);
    res.status(500).end();
  }
});

sseRouter.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);

  if (transport) {
    await transport.handlePostMessage(req, res, req.body);
  } else {
    console.log(`No transport found for sessionId: ${sessionId}`);
    res.status(400).send('No transport found for sessionId');
  }
});
