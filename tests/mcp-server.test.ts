import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const SERVER_URL = 'http://localhost:3009';
const TEST_CHAT_ID = 'chat-123';
const TEST_USER_ID = 'user-123';

const TEST_USER_ACCESS_TOKEN = jwt.sign(
  {
    id: TEST_USER_ID,
  },
  'secret'
);

// Helper to create a client and transport
async function setupClientAndTransport({ apps }: { apps?: string[] } = {}) {
  const client = new Client({
    name: `test-client${apps && apps.length > 0 ? '-' + apps.join('-') : ''}`,
    version: '1.0.0',
  });
  const url =
    apps && apps.length > 0
      ? new URL(`${SERVER_URL}/mcp?apps=${apps.join(',')}`)
      : new URL(`${SERVER_URL}/mcp`);
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: {
      headers: {
        Authorization: `Bearer ${TEST_USER_ACCESS_TOKEN}`,
      },
    },
  });
  await client.connect(transport);
  return { client, transport };
}

describe('MCP Server Integration Tests', () => {
  let client: any;
  let transport: StreamableHTTPClientTransport;

  beforeAll(async () => {
    // Setup client and transport for all tests
    client = new Client({
      name: 'test-client',
      version: '1.0.0',
    });

    transport = new StreamableHTTPClientTransport(new URL(`${SERVER_URL}/mcp`), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${TEST_USER_ACCESS_TOKEN}`,
          'x-chat-id': TEST_CHAT_ID,
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup after all tests
    if (transport) {
      await transport.close();
    }
  });

  describe('1. Connection Tests', () => {
    test('should connect to MCP server successfully', async () => {
      expect(client).toBeDefined();
      expect(transport).toBeDefined();

      await client.connect(transport);
    });
  });

  describe('2. Tool Discovery Tests', () => {
    test('should have correct number of tools', async () => {
      const tools = await client.listTools();
      expect(tools.tools.length).toBe(2);
    });
  });

  describe('3. Tool Execution Tests', () => {
    test('should execute a tool successfully', async () => {
      const tools = await client.listTools();

      const firstTool = tools.tools[0];

      const args = {
        message: 'Hello',
      };

      const result = await client.callTool({
        name: firstTool.name,
        arguments: args,
      });

      expect(result).toStrictEqual({
        content: [
          {
            text: JSON.stringify('You passed in' + JSON.stringify(args)),
            type: 'text',
          },
        ],
      });
    });
  });

  describe('4. Integration Key Filtering Tests', () => {
    test('should return all tools when no integration key is provided', async () => {
      const { client, transport } = await setupClientAndTransport();
      const tools = await client.listTools();
      const toolNames = tools.tools.map((tool: any) => tool.name);
      expect(tools.tools.length).toBe(2);
      expect(toolNames.some((name: string) => name.startsWith('google-calendar_'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('gmail_'))).toBe(true);
      await transport.close();
    });

    test('should return only google-calendar tools when integration key is google-calendar', async () => {
      const { client, transport } = await setupClientAndTransport({
        apps: ['google-calendar'],
      });
      const tools = await client.listTools();
      const toolNames = tools.tools.map((tool: any) => tool.name);
      expect(tools.tools.length).toBe(1);
      expect(toolNames[0]).toMatch(/^google-calendar_/);
      await transport.close();
    });

    test('should return only gmail tools when integration key is gmail', async () => {
      const { client, transport } = await setupClientAndTransport({ apps: ['gmail'] });
      const tools = await client.listTools();
      const toolNames = tools.tools.map((tool: any) => tool.name);
      expect(tools.tools.length).toBe(1);
      expect(toolNames[0]).toMatch(/^gmail_/);
      await transport.close();
    });

    test('should return no tools when invalid integration key is provided', async () => {
      const { client, transport } = await setupClientAndTransport({
        apps: ['invalid-integration'],
      });
      let errorCaught = false;
      try {
        const tools = await client.listTools();
        expect(tools.tools.length).toBe(0);
      } catch (err: any) {
        errorCaught = true;
        expect(err.message).toMatch(/Method not found|tools/);
      }
      expect(errorCaught).toBe(true);
      await transport.close();
    });

    test('should execute filtered tool successfully', async () => {
      const { client, transport } = await setupClientAndTransport({
        apps: ['google-calendar'],
      });
      const tools = await client.listTools();
      expect(tools.tools.length).toBe(1);
      const googleCalendarTool = tools.tools[0];
      const args = { message: 'Create a test event' };
      const result = await client.callTool({ name: googleCalendarTool.name, arguments: args });
      expect(result).toStrictEqual({
        content: [
          {
            text: JSON.stringify('You passed in' + JSON.stringify(args)),
            type: 'text',
          },
        ],
      });
      await transport.close();
    });

    test('should return tools for multiple apps when multiple apps are specified', async () => {
      const { client, transport } = await setupClientAndTransport({
        apps: ['google-calendar', 'gmail'],
      });
      const tools = await client.listTools();
      const toolNames = tools.tools.map((tool: any) => tool.name);
      expect(tools.tools.length).toBe(2);
      expect(toolNames.some((name: string) => name.startsWith('google-calendar_'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('gmail_'))).toBe(true);
      await transport.close();
    });
  });
});
