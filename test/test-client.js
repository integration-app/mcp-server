const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
const dotenv = require('dotenv');

dotenv.config();

// You need to set these values:
const INTEGRATION_KEY = 'hubspot'; // Replace with your actual Integration Key
const SERVER_URL = 'http://localhost:3000';

async function testMcpServer() {
  try {
    // Create a new MCP client
    const client = new Client({
      name: 'test-client',
      version: '1.0.0'
    });

    // Create SSE transport with the integration key
    const transport = new SSEClientTransport(
      new URL(`${SERVER_URL}/sse?integrationKey=${INTEGRATION_KEY}`)
    );

    // Connect to the server
    await client.connect(transport);
    console.log('Connected to MCP server');

    // List available tools
    console.log('Listing tools...');
    const tools = await client.listTools();
    console.log('Available tools:', tools);

    // Example: Call a tool if available
    if (tools.tools.length > 0) {
      const firstTool = tools.tools[0];
      console.log(`Testing tool: ${firstTool.name}`);
      
      try {
        console.log(`Attempting to call tool: ${firstTool.name}`);
        const result = await client.callTool(firstTool.name, {});
        console.log('Tool result:', result);
      } catch (error) {
        console.error('Error calling tool:', error);
      }
    }

    // Close the connection
    await transport.close();
    console.log('Disconnected from MCP server');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testMcpServer(); 