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
    name: `test-client`,
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

  describe('4. Selected Apps Filtering Tests', () => {
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

  describe('5. Dynamic Mode Tests', () => {
    // Helper to create a client and transport for dynamic mode
    async function setupDynamicClientAndTransport({ apps }: { apps?: string[] } = {}) {
      const client = new Client({
        name: `test-dynamic-client`,
        version: '1.0.0',
      });
      const urlParams = new URLSearchParams();
      if (apps && apps.length > 0) {
        urlParams.append('apps', apps.join(','));
      }
      urlParams.append('mode', 'dynamic');

      const url = new URL(`${SERVER_URL}/mcp?${urlParams.toString()}`);
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

    test('should return only enable-tools when in dynamic mode', async () => {
      const { client, transport } = await setupDynamicClientAndTransport();
      const tools = await client.listTools();
      expect(tools.tools.length).toBe(1);
      expect(tools.tools[0].name).toBe('enable-tools');
      expect(tools.tools[0].description).toBe('Enable a list of tools for the session');
      await transport.close();
    });

    test('should return only enable-tools when in dynamic mode with specific apps', async () => {
      const { client, transport } = await setupDynamicClientAndTransport({
        apps: ['google-calendar'],
      });
      const tools = await client.listTools();
      expect(tools.tools.length).toBe(1);
      expect(tools.tools[0].name).toBe('enable-tools');
      await transport.close();
    });

    test('should enable tools successfully via enable-tools', async () => {
      const { client, transport } = await setupDynamicClientAndTransport();

      // Initially should only have enable-tools
      let tools = await client.listTools();
      expect(tools.tools.length).toBe(1);
      expect(tools.tools[0].name).toBe('enable-tools');

      // Enable a specific tool
      const enableResult = await client.callTool({
        name: 'enable-tools',
        arguments: {
          tools: ['google-calendar_create_event'],
        },
      });

      // After enabling, should have the enabled tool plus enable-tools
      tools = await client.listTools();
      expect(tools.tools.length).toBe(2);
      const toolNames = tools.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('enable-tools');
      expect(toolNames).toContain('google-calendar_create_event');

      await transport.close();
    });

    test('should enable multiple tools successfully', async () => {
      const { client, transport } = await setupDynamicClientAndTransport();

      // Enable multiple tools
      const enableResult = await client.callTool({
        name: 'enable-tools',
        arguments: {
          tools: ['google-calendar_create_event', 'gmail_send_email'],
        },
      });

      expect(enableResult).toStrictEqual({
        content: [
          {
            text: 'Tools enabled',
            type: 'text',
          },
        ],
      });

      // Should have enable-tools plus the two enabled tools
      const tools = await client.listTools();
      expect(tools.tools.length).toBe(3);
      const toolNames = tools.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('enable-tools');
      expect(toolNames).toContain('google-calendar_create_event');
      expect(toolNames).toContain('gmail_send_email');

      await transport.close();
    });

    test('should disable previous tools when enabling new ones', async () => {
      const { client, transport } = await setupDynamicClientAndTransport();

      // Enable first set of tools
      await client.callTool({
        name: 'enable-tools',
        arguments: {
          tools: ['google-calendar_create_event'],
        },
      });

      let tools = await client.listTools();
      expect(tools.tools.length).toBe(2);
      expect(tools.tools.some((tool: any) => tool.name === 'google-calendar_create_event')).toBe(
        true
      );

      // Enable different set of tools
      await client.callTool({
        name: 'enable-tools',
        arguments: {
          tools: ['gmail_send_email'],
        },
      });

      // Should only have the new tool enabled (plus enable-tools)
      tools = await client.listTools();
      expect(tools.tools.length).toBe(2);
      expect(tools.tools.some((tool: any) => tool.name === 'enable-tools')).toBe(true);
      expect(tools.tools.some((tool: any) => tool.name === 'gmail_send_email')).toBe(true);
      expect(tools.tools.some((tool: any) => tool.name === 'google-calendar_create_event')).toBe(
        false
      );

      await transport.close();
    });

    test('should execute enabled tool successfully', async () => {
      const { client, transport } = await setupDynamicClientAndTransport();

      // Enable a tool
      await client.callTool({
        name: 'enable-tools',
        arguments: {
          tools: ['google-calendar_create_event'],
        },
      });

      // Execute the enabled tool
      const result = await client.callTool({
        name: 'google-calendar_create_event',
        arguments: {
          message: 'Create a test event',
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            text: JSON.stringify(
              'You passed in' + JSON.stringify({ message: 'Create a test event' })
            ),
            type: 'text',
          },
        ],
      });

      await transport.close();
    });

    test('should handle enabling non-existent tools gracefully', async () => {
      const { client, transport } = await setupDynamicClientAndTransport();

      // Try to enable a non-existent tool
      const enableResult = await client.callTool({
        name: 'enable-tools',
        arguments: {
          tools: ['non-existent-tool'],
        },
      });

      expect(enableResult).toStrictEqual({
        content: [
          {
            text: 'Tools enabled',
            type: 'text',
          },
        ],
      });

      // Should still only have enable-tools (non-existent tool wasn't added)
      const tools = await client.listTools();
      expect(tools.tools.length).toBe(1);
      expect(tools.tools[0].name).toBe('enable-tools');

      await transport.close();
    });

    test('should handle mixed valid and invalid tools', async () => {
      const { client, transport } = await setupDynamicClientAndTransport();

      // Try to enable both valid and invalid tools
      const enableResult = await client.callTool({
        name: 'enable-tools',
        arguments: {
          tools: ['google-calendar_create_event', 'non-existent-tool'],
        },
      });

      expect(enableResult).toStrictEqual({
        content: [
          {
            text: 'Tools enabled',
            type: 'text',
          },
        ],
      });

      // Should have enable-tools plus the valid tool
      const tools = await client.listTools();
      expect(tools.tools.length).toBe(2);
      const toolNames = tools.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('enable-tools');
      expect(toolNames).toContain('google-calendar_create_event');
      expect(toolNames).not.toContain('non-existent-tool');

      await transport.close();
    });

    test('should work with dynamic mode and app filtering', async () => {
      const { client, transport } = await setupDynamicClientAndTransport({
        apps: ['google-calendar'],
      });

      // Enable a tool that exists for the filtered app
      await client.callTool({
        name: 'enable-tools',
        arguments: {
          tools: ['google-calendar_create_event'],
        },
      });

      const tools = await client.listTools();
      expect(tools.tools.length).toBe(2);
      const toolNames = tools.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('enable-tools');
      expect(toolNames).toContain('google-calendar_create_event');

      await transport.close();
    });
  });
});
