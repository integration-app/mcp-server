import { IntegrationAppClient } from '@integration-app/sdk';
import { fetchAllWithPagination } from './fetch-with-pagination';

export function getAllConnections({
  apps,
  membrane,
}: {
  apps?: string[];
  membrane: IntegrationAppClient;
}) {
  const fetchFn = async ({ cursor }: { cursor?: string }) => {
    if (apps && apps.length > 0) {
      // If specific apps are requested, fetch connections for all apps in parallel
      const connectionPromises = apps.map(app =>
        membrane.connections.find({
          integrationKey: app,
        })
      );

      const connectionsResults = await Promise.all(connectionPromises);
      const allConnections = connectionsResults.flatMap(result => result.items);

      return { items: allConnections, cursor: undefined };
    } else {
      // If no apps specified, fetch all connections
      const connections = await membrane.connections.find({});
      return connections;
    }
  };
  return fetchAllWithPagination(fetchFn);
}
