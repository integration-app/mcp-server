import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import express from 'express';
import { createMcpServer } from '../utils/create-mcp-server';
import { addServerTool } from '../utils/tools/add-server-tool';
import { getActionsForAllConnectedApp } from '../utils/tools/get-actions-for-all-connected-app';
import { IntegrationAppClient } from '@integration-app/sdk';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/dist/esm/types';

export const streamableHttpRouter = express.Router();

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

streamableHttpRouter.post('/', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  /**
   * If integrationKey is provided, MCP server only return tools for the integration
   */
  const integrationKey = req.query.integrationKey as string | undefined;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: sessionId => {
        transports[sessionId] = transport;
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const { mcpServer } = createMcpServer();

    const membrane = new IntegrationAppClient({
      token: req.token,
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
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

streamableHttpRouter.get('/', handleSessionRequest);

streamableHttpRouter.delete('/', handleSessionRequest);
