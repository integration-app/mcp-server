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

  let transport: SSEServerTransport;

  const { mcpServer } = createMcpServer();

  if (req?.query?.sessionId) {
    const sessionId = req?.query?.sessionId as string;
    transport = transports.get(sessionId) as SSEServerTransport;
    console.error(
      "Client Reconnecting? This shouldn't happen; when client has a sessionId, GET /sse should not be called again.",
      transport.sessionId
    );
  } else {
    // Create and store transport for new session
    transport = new SSEServerTransport(`/sse/messages?token=${token}`, res);
    transports.set(transport.sessionId, transport);

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

    console.error('Client Connected: ', transport.sessionId);

    // Handle close of connection
    res.on('close', async () => {
      console.error('Client Disconnected: ', transport.sessionId);
      transports.delete(transport.sessionId);
      await mcpServer.close();
    });
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
