import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { IntegrationAppClient } from '@integration-app/sdk';
import { addServerTool } from '../utils/tools/add-server-tool';
import { getActionsForAllConnectedApp } from '../utils/tools/get-actions-for-all-connected-app';
import { mcpServer } from '../utils/create-mcp-server';

const router = express.Router();

const transports: Record<string, SSEServerTransport> = {};

router.get('/', async (req, res) => {
  const token = req.query.token as string;
  const integrationKey = req.query.integrationKey as string | undefined;

  if (!token) {
    console.log('SSE request missing token');
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  const transport = new SSEServerTransport('/sse/messages', res);
  transports[transport.sessionId] = transport;

  res.on('close', () => {
    console.log(`SSE connection closed for session: ${transport.sessionId}`);
    delete transports[transport.sessionId];
  });

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

router.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];

  if (transport) {
    await transport.handlePostMessage(req, res, req.body);
  } else {
    console.log(`No transport found for sessionId: ${sessionId}`);
    res.status(400).send('No transport found for sessionId');
  }
});

export default router;
