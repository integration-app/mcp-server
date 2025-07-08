# Integration App MCP Server
<img width="1148" alt="Screenshot 2025-07-07 at 23 03 05" src="https://github.com/user-attachments/assets/39f6cc74-a689-4657-91f3-ee8358c05e31" />


The Integration App MCP Server is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server, it provides actions for connected integrations on Integration.app membrane as tools.

Here's our official [AI Agent Example](https://github.com/integration-app/ai-agent-example) that shows you how to use this MCP server in your application.

### 📋 Prerequisites

- Node.js (v14 or higher)
- An [Integration.app](https://integration.app) account

### ⚙️ Installation

```bash
git clone https://github.com/integration-app/mcp-server.git
cd mcp-server
npm install
npm run build
```

### 🛠️ Local Development

To run the development server locally, start it with:

```bash
npm run dev
```

The server will be live at `http://localhost:3000` ⚡️

### 🧪 Running tests

```bash
npm run start:test

# then run tests
npm test
```

### 🚀 Deployment

Ideally, you'd want to deploy your own instance of this MCP server to any cloud hosting service of your choice.

#### 🐳 Docker

The project includes a Dockerfile for easy containerized deployment.

```bash
docker build -t integration-app-mcp-server .
docker run -p 3000:3000 integration-app-mcp-server
```

### 🔗 Connecting to the MCP server

This MCP server support two transports:

| Transport                                                                                                              | Endpoint | Status                                                                 |
| ---------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| [SSE](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse-deprecated) (Server‑Sent Events) | `/sse`   | 🔴 **Deprecated** — deprecated as of November 5, 2024 in MCP spec      |
| [HTTP](https://modelcontextprotocol.io/docs/concepts/transports#streamable-http) (Streamable HTTP)                     | `/mcp`   | 🟢 **Recommended** — replaces SSE and supports bidirectional streaming |

### 🔐 Authentication

Provide an Integration.app access token via query or `Authorization` header:

```http
?token=ACCESS_TOKEN
Authorization: Bearer ACCESS_TOKEN
```

**SSE** (Deprecated)

```js
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

### ⚡ Static & Dynamic Mode

By default, the MCP server is in `static` mode and will return all tools. In `dynamic` mode (`?mode=dynamic`) the MCP server will only return only a single tool: `enable-tools`, you can use this tool to enable tools for the session.

Your implementation needs to provide a way to find the most relevant tools to the user query, after which you can use the `enable-tools` tool to enable the tools for the session. Ideally you want to prompt LLM to call this tool

See an example implementation in our [AI Agent Example](https://github.com/integration-app/ai-agent-example)

```ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({
  name: 'example-integration-app-mcp-client',
  version: '1.0.0',
});

const transport = new StreamableHTTPClientTransport(
  new URL(`https://<HOSTED_MCP_SERVER_URL>/mcp?mode=dynamic`),
  {
    requestInit: {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    },
  }
);

await client.connect(transport);

await client.callTool({
  name: 'enable-tools',
  arguments: {
    tools: ['gmail-send-email', 'gmail-read-email'],
  },
});
```

### 🔧 Getting tools for a specific integrations

In static mode, the MCP server fetches tools from all active connections associated with the provided token.

You can choose to only fetch tools for a specific integration by passing the `apps` query parameter: `/mcp?apps=google-calendar,google-docs`

### Configuring other MCP clients

#### 📝 Cursor

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

#### 🤖 Claude Desktop

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

### 🔧 Troubleshooting

- Ensure your access token is valid and you're generating it according to [these instructions](https://docs.integration.app/docs/authentication#access-token)
- Check the MCP server logs for any errors or issues during startup or connection attempts.
- Use the [MCP Inspector](https://www.npmjs.com/package/@modelcontextprotocol/inspector) for testing and debugging
