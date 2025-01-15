#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { IntegrationAppClient } from '@integration-app/sdk'


const client = new IntegrationAppClient({
  token: process.env.INTEGRATION_APP_TOKEN,
})

export async function startServer() {
  if (!process.env.INTEGRATION_KEY) {
    throw new Error('INTEGRATION_KEY is not set')
  }

  if (!process.env.INTEGRATION_APP_TOKEN) {
    throw new Error('INTEGRATION_APP_TOKEN is not set')
  }

  const integrationKey = process.env.INTEGRATION_KEY
  const integration = await client.integration(integrationKey).get()

  const server = new Server(
    {
      name: `integration-app-${integrationKey}`,
      version: '1.0.0',
      description: `Working with ${integration.name}.`,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  )

  const tools = await getToolsFromActions(integrationKey)

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params

      const result = await callToolFromAction(integrationKey, name, args)

      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        isError: false,
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

export async function getToolsFromActions(integrationKey: string): Promise<Tool[]> {
  const integration = await client
    .integration(integrationKey)
    .get()

  const actions = await client.actions.find({
    integrationId: integration.id,
  })

  const tools: Tool[] = []

  for (const action of actions.items) {
    tools.push({
      name: action.key,
      description: action.name,
      inputSchema: action.inputSchema as any,
    })
  }

  return tools
}

export async function callToolFromAction(integrationKey: string, name: string, args: any) {
  const result = await client
    .actionInstance({
      autoCreate: true,
      integrationKey,
      parentKey: name,
    })
    .run(args)
  return result.output
}

void startServer()
