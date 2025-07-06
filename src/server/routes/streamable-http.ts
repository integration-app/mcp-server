import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import express, { Request, Response } from 'express';
import { createMcpServer } from '../utils/create-mcp-server';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';

export const streamableHttpRouter = express.Router();

const transports: Map<string, StreamableHTTPServerTransport> = new Map<
  string,
  StreamableHTTPServerTransport
>();

streamableHttpRouter.post('/', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  try {
    if (sessionId && transports.has(sessionId)) {
      // Reuse existing transport
      transport = transports.get(sessionId)!;
    } else if (!sessionId) {
      // New initialization request
      const eventStore = new InMemoryEventStore();

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore, // Enable resumability
        onsessioninitialized: sessionId => {
          console.log(`⚡️ Session initialized with ID: ${sessionId}`);

          // Store the transport by session ID when session is initialized
          // This avoids race conditions where requests might come in before the session is stored
          transports.set(sessionId, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          console.log(
            `Transport closed for session ${transport.sessionId}, removing from transports map`
          );
          transports.delete(transport.sessionId);
        }
      };

      const { mcpServer } = await createMcpServer({
        userAccessToken: req.token!,
        integrationKey: req.query.integrationKey as string | undefined,
      });

      // Connect the transport to the MCP server BEFORE handling the request
      // so responses can flow back through the same transport
      await mcpServer.connect(transport);

      await transport.handleRequest(req, res, req.body);
      return;
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

    console.log(`Connected to MCP server`);
    // Handle the request with existing transport - no need to reconnect
    // The existing transport is already connected to the server
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// Handle GET requests for SSE streams (using built-in support from StreamableHTTP)
streamableHttpRouter.get('/', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: req?.body?.id,
    });
    return;
  }

  try {
    // Check for Last-Event-ID header for resumability
    const lastEventId = req.headers['last-event-id'] as string | undefined;
    if (lastEventId) {
      console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    } else {
      console.log(`Establishing new SSE stream for session ${sessionId}`);
    }

    const transport = transports.get(sessionId);
    await transport!.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling MCP GET request:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing MCP GET request');
    }
  }
});

// Handle DELETE requests for session termination (according to MCP spec)
streamableHttpRouter.delete('/', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: req?.body?.id,
    });
    return;
  }

  console.error(`Received session termination request for session ${sessionId}`);

  try {
    const transport = transports.get(sessionId);
    await transport!.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Error handling session termination',
        },
        id: req?.body?.id,
      });
      return;
    }
  }
});
