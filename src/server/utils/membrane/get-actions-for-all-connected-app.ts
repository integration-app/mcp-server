import { getAllActionsForIntegration } from './get-all-actions';
import { getAllConnections } from './get-all-connections';
import { IntegrationAppClient } from '@integration-app/sdk';

export async function getActionsForAllConnectedApp({
  membrane,
  apps,
}: {
  membrane: IntegrationAppClient;
  apps?: string[];
}) {
  const connections = await getAllConnections({
    apps,
    membrane,
  });

  const actions = [];

  for (const connection of connections) {
    try {
      if (!connection.integration) {
        continue;
      }

      const allActions = await getAllActionsForIntegration({
        integrationId: connection.integration.id,
        membrane,
      });

      actions.push(...allActions);
    } catch (error) {
      console.error(`Error processing connection ${connection.id}:`, error);
    }
  }
  return actions;
}
