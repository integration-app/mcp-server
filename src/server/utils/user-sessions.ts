/**
 * Stores user sessions per chat
 *
 * @example
 * {
 *  "userId": {
 *    "chatId": "sessionId",
 *    "chatId2": "sessionId2",
 *  }
 * }
 */

const userSessions: Record<string, Record<string, string>> = {};

export const addToUserSessions = ({
  userId,
  chatId,
  sessionId,
}: {
  userId: string;
  chatId?: string;
  sessionId: string;
}) => {
  const currentSessionsForUser = userSessions[userId] ?? {};
  userSessions[userId] = {
    ...currentSessionsForUser,
    [chatId ?? sessionId]: sessionId,
  };
};

export const removeFromUserSessions = ({
  userId,
  chatId,
  sessionId,
}: {
  userId: string;
  chatId?: string;
  sessionId: string;
}) => {
  const currentSessionsForUser = userSessions[userId];
  if (currentSessionsForUser) {
    delete currentSessionsForUser[chatId ?? sessionId];
    userSessions[userId] = currentSessionsForUser;
  }
};

export const getUserSessions = (userId: string) => {
  return userSessions[userId];
};
