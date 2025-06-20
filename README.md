# Integration App MCP Server

This is an implementation of the [MCP (Model Context Protocol)](https://modelcontextprotocol.io/introduction) it provide actions on active connections as tools.

For implementing your application, see our example AI Chat Agent:

- [AI Chat Agent (MCP Client application)](https://github.com/integration-app/MCP-chat-example)

### Prerequisites

- Node.js (v14 or higher)
- An [Integration.app](https://integration.app) account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/integration-app/mcp-server
   cd mcp-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

### Local Development

To run the server locally, start it with:

```bash
npm start
```

The server will run on `http://localhost:3000`.

### Deployment

Ideally, you'd want to deploy your own instance of this MCP server to any cloud hosting service of your choice.

Environment variables:

- `PORT`: The port on which the server will run (default: 3000)

### Connecting to the MCP server

The server support two transports:

- [SSE](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse-deprecated) (Server-Sent Events) - <span style="color: red">Deprecated</span>
- [HTTP](https://modelcontextprotocol.io/docs/concepts/transports#streamable-http) (Streamable HTTP) - <span style="color: green">Recommended</span>

Each transport has its own endpoint:

- SSE: `/sse`
- HTTP: `/mcp`

### Authentication

You'd need your customers [access token](https://docs.integration.app/docs/authentication#access-token) to connect to the MCP server. The token can be passed as query or via `Authorization` header for all transports.

**SSE**

```js
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const client = new Client({ name: 'sample-client', version: '1.0.0' });

await client.connect(
  new SSEClientTransport(new URL(`https://{HOSTED_MCP_SERVER_URL}/sse?token=${ACCESS_TOKEN}`))
);

// ----- or -----

await client.connect(
    new SSEClientTransport(
      new URL(
        `https://{HOSTED_MCP_SERVER_URL}/sse`
      )
      {
        requestInit: {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        },
      }
    )
  );
```

**Streamable HTTP**

```js
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({ name: 'sample-client', version: '1.0.0' });

await client.connect(
  new StreamableHTTPClientTransport(
    new URL(`https://{HOSTED_MCP_SERVER_URL}/mcp?token=${ACCESS_TOKEN}`)
  )
);

// ----- or -----

await client.connect(
  new StreamableHTTPClientTransport(
    new URL(`https://{HOSTED_MCP_SERVER_URL}/mcp`)
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      },
    }
  )
);
```

#### Cursor Configuration

To use this server with Cursor, update the `~/.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "integration-app": {
      "url": "https://{HOSTED_MCP_SERVER_URL}/sse?token={ACCESS_TOKEN}"
    }
  }
}
```

Restart Cursor for the changes to take effect.

#### Claude Desktop Configuration

To use this server with Claude, update the config file (Settings > Developer > Edit Config):

```json
{
  "mcpServers": {
    "integration-app": {
      "url": "https://{HOSTED_MCP_SERVER_URL}/sse?token={ACCESS_TOKEN}"
    }
  }
}
```

## Troubleshooting

- Ensure your access token is valid and you're generating it according to [these instructions](https://docs.integration.app/docs/authentication#access-token)
- Check the MCP server logs for any errors or issues during startup or connection attempts.
- Verify that your server is running with `/` endpoint.
