import { IntegrationAppClient } from '@integration-app/sdk';
import { fetchAllWithPagination } from './fetch-with-pagination';

export function getAllActionsForIntegration({
  integrationId,
  membrane,
}: {
  integrationId: string;
  membrane: IntegrationAppClient;
}) {
  const fetchFn = async ({ cursor }: { cursor?: string }) => {
    const actions = await membrane.actions.find({
      integrationId,
      cursor,
    });
    return actions;
  };
  return fetchAllWithPagination(fetchFn);
}
