# Integration App MCP Server

The Integration App MCP Server is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server, it provides actions for connected integrations as tools.

For implementing your application, see our example AI Chat Agent:

- [AI Chat Agent (MCP Client application)](https://github.com/integration-app/MCP-chat-example)

### Prerequisites

- Node.js (v14 or higher)
- An [Integration.app](https://integration.app) account

### Installation

```bash
git clone https://github.com/integration-app/mcp-server.git
cd mcp-server
npm install
npm run build
```

### Local Development

To run the server locally, start it with:

```bash
npm start
```

Access it at `http://localhost:3000`

### Deployment

Ideally, you'd want to deploy your own instance of this MCP server to any cloud hosting service of your choice.

#### Docker

The project includes a Dockerfile for easy containerized deployment.

```bash
docker build -t integration-app-mcp-server .
docker run -p 3000:3000 integration-app-mcp-server
```

### Connecting to the MCP server

This MCP server support two transports:

| Transport                                                                                                              | Endpoint | Status                                                                 |
| ---------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| [SSE](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse-deprecated) (Server‑Sent Events) | `/sse`   | 🔴 **Deprecated** — deprecated as of November 5, 2024 in MCP spec      |
| [HTTP](https://modelcontextprotocol.io/docs/concepts/transports#streamable-http) (Streamable HTTP)                     | `/mcp`   | 🟢 **Recommended** — replaces SSE and supports bidirectional streaming |

### Authentication

Provide an Integration.app access token via query or header:

```http
?token=ACCESS_TOKEN
Authorization: Bearer ACCESS_TOKEN
```

**SSE** (Deprecated)

```js
await client.connect(
  new SSEClientTransport(new URL(`https://<HOSTED_MCP_SERVER_URL>/sse?token=${ACCESS_TOKEN}`))
);

// ----- or -----

await client.connect(
  new SSEClientTransport(
    new URL(
      `https://<HOSTED_MCP_SERVER_URL>/sse`
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

**Streamable HTTP** (Recommended)

```js
await client.connect(
  new StreamableHTTPClientTransport(
    new URL(`https://<HOSTED_MCP_SERVER_URL>/mcp?token=${ACCESS_TOKEN}`)
  )
);

// ----- or -----

await client.connect(
  new StreamableHTTPClientTransport(
    new URL(`https://<HOSTED_MCP_SERVER_URL>/mcp`)
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
      "url": "https://<HOSTED_MCP_SERVER_URL>/sse?token={ACCESS_TOKEN}"
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
      "url": "https://<HOSTED_MCP_SERVER_URL>/sse?token={ACCESS_TOKEN}"
    }
  }
}
```

### Integration Scoping

By default, the MCP server fetches tools from all active connections associated with the provided token.

You can also get tools for a specific integration by passing the `integrationKey` query parameter: `/mcp?integrationKey=google-calendar`

## Troubleshooting

- Ensure your access token is valid and you're generating it according to [these instructions](https://docs.integration.app/docs/authentication#access-token)
- Check the MCP server logs for any errors or issues during startup or connection attempts.
