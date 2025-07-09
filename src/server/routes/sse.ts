import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpServer, CreateMcpServerParams } from '../utils/create-mcp-server';

/**
 * MCP Over SSE is deprecated
 * See: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http
 *
 * After now, we should only support streamable-http (/mcp) and remove the /sse endpoint.
 */

export const sseRouter = express.Router();

const transports: Map<string, SSEServerTransport> = new Map<string, SSEServerTransport>();

sseRouter.get('/', async (req, res) => {
  try {
    const token = req.token;
    const sessionId = req.query.sessionId as string | undefined;
    const apps = req.query.apps
      ? (req.query.apps as string).split(',').map(app => app.trim())
      : undefined;
    const mode = req.query.mode as CreateMcpServerParams['mode'];

    // Handle existing session
    if (sessionId) {
      const transport = transports.get(sessionId);

      if (!transport) {
        return res.status(404).json({ error: 'Session not found' });
      }

      console.log('Client reconnecting with sessionId:', sessionId);
      return;
    }

    // Create new session
    const transport = new SSEServerTransport(`/sse/messages?token=${token}`, res);

    transports.set(transport.sessionId, transport);

    const { mcpServer } = await createMcpServer({
      userAccessToken: req.token!,
      apps,
      mode,
    });

    await mcpServer.connect(transport);

    console.log('Client Connected:', transport.sessionId);

    // Handle connection cleanup
    const cleanup = async () => {
      console.log('Client Disconnected:', transport.sessionId);
      transports.delete(transport.sessionId);
      await mcpServer.close();
    };

    res.on('close', cleanup);
    res.on('error', cleanup);
  } catch (error) {
    console.error('Error in SSE GET handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

sseRouter.post('/messages', async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      console.error('No sessionId provided in POST /messages request');
      return res.status(400).json({ error: 'Session ID required' });
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      console.error(`No transport found for sessionId: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error('Error in SSE POST handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
