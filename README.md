# Integration App MCP Server 

## Overview 

This is an implementation of the [Model Context Protocol (MCP) server](https://modelcontextprotocol.org/) that exposes tools powered by [Integration App](https://integration.app).

## Managing Tools

This server uses Actions defined in an Integration App workspace as tools. 
To understand how this works and how to effectively manage tools for each application, please refer to the [Using Tools](https://console.integration.app/docs/use-cases/ai/use-tools) guide.

## Running the server

1. Install [node.js](https://nodejs.org)
2. Configure some actions in your Integration App workspace
3. Get Integration App token from your [Workspace Settings](https://console.integration.app/w/0/settings/testing) page or generate using your Workspace Key and Secret ([Authentication Guide](https://console.integration.app/w/625eb136b4af031bffb2e9eb/docs/getting-started/authentication)).

You need to provide two environment variables to the server:
* `INTEGRATION_APP_TOKEN` - token for accessing Integration App API
* `INTEGRATION_KEY` - key of the integration you want to use tools for

This server exposes tools from one integration at a time. If you want to expose tools from multiple integrations, you can create multiple servers or modify the code to iterate over multiple integrations.

Here is an example of claude_desktop_config.json file with the server configured: 

```json
{
  "mcpServers": {
    "integration-app-hubspot": {
      "command": "npx",
      "args": ["-y", "@integration-app/mcp-server"],
      "env": {
         "INTEGRATION_APP_TOKEN": "<your-integration-app-token>",
         "INTEGRATION_KEY": "hubspot"
      }
    }
  }
}
```

## Testing 

To understand if everything works as expected, you can ask Claude what tools are available: 

![Claude Test](https://github.com/user-attachments/assets/693aba6f-d7ee-47ad-9fcd-a966e1935214)
