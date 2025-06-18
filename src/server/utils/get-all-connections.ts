import { IntegrationAppClient } from '@integration-app/sdk/dist';
import { fetchAllWithPagination } from './fetch-with-pagination';

export function getAllConnections({
  integrationKey,
  membrane,
}: {
  integrationKey?: string;
  membrane: IntegrationAppClient;
}) {
  const fetchFn = async ({ cursor }: { cursor?: string }) => {
    const connections = await membrane.connections.find(
      integrationKey
        ? {
            integrationKey,
          }
        : {}
    );

    return connections;
  };
  return fetchAllWithPagination(fetchFn);
}
