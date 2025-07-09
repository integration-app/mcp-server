import { IntegrationAppClient } from '@integration-app/sdk';

export const getActionsByKeys = async (
  membrane: IntegrationAppClient,
  _actions: {
    key: string;
    integrationKey: string;
  }[]
) => {
  const results = await Promise.allSettled(
    _actions.map(async action => {
      return membrane
        .action({
          integrationKey: action.integrationKey,
          key: action.key,
        })
        .get();
    })
  );

  // Filter out failed promises and return only successful results
  const successfulActions = results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value);

  return successfulActions;
};
