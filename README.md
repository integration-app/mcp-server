# Integration App MCP Server

This is an implementation of the [MCP (Model Context Protocol)](https://modelcontextprotocol.io/introduction) server that exposes tools powered by Integration App. It allows clients to connect and access tools from active connections, using the MCP [SSE transport](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse).

To implement your own MCP client, see our example AI Chat Agent:
- [AI Chat Agent (MCP Client application)](https://github.com/integration-app/MCP-chat-example)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- An Integration App account

## Installation

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

## Configuration

### Local Development

To run the server locally, start it with:
```bash
npm start
```

The server will run on `http://localhost:3000`.

### Deployment

To deploy the server to a production environment (e.g., Heroku), follow these steps:

1. Ensure your environment variables are set:
   - `PORT`: The port on which the server will run (default: 3000)
   - `NODE_ENV`: Set to `production` for production environments

2. Deploy your application using your preferred hosting service (e.g., Heroku, AWS, etc.).

3. Once deployed, your server will be accessible at a URL like:
   ```
   https://your-app-name.herokuapp.com/
   ```

### Connection URL

To connect to the MCP server, use the following URL format:
```
https://your-app-name.herokuapp.com/sse?token=YOUR_TOKEN
```

Or, if the server is running locally:
```
http://localhost:3000/sse?token=YOUR_TOKEN
```

Replace YOUR_TOKEN with a valid [Integration App Token](https://console.integration.app/docs/getting-started/authentication)

### Cursor Configuration

To use this server with Cursor, update your `~/.cursor/mcp.json` file:
```json
{
  "mcpServers": {
    "integration-app": {
      "url": "https://your-app-name.herokuapp.com/sse?token=YOUR_TOKEN"
    }
  }
}
```

Restart Cursor for the changes to take effect.

### Claude Desktop Configuration

Anthropic only allows SSE MCP tranports to Claude with MAX plan or higher. To use this server with Claude, update the config file (Settings > Developer > Edit Config):
```json
{
  "mcpServers": {
    "integration-app": {
      "url": "https://your-app-name.herokuapp.com/sse?token=YOUR_TOKEN"
    }
  }
}
```

## MCP Information

- The server fetches tools from all active connections associated with the provided token.
- The server supports SSE (Server-Sent Events) transports.

## Troubleshooting

- Ensure your Integration App token is valid and has the necessary permissions.
- Check server logs for any errors or issues during startup or connection attempts.
- Verify that your deployment environment has the correct environment variables set.
