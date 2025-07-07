import { colors, getStatusColor, getMethodColor, colorize } from '../utils/colors';

export const customMorganFormat = (tokens: any, req: any, res: any) => {
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const status = tokens.status(req, res);
  const responseTime = tokens['response-time'](req, res);

  // Truncate URL if it's longer than 100 characters
  let truncatedUrl = url;
  if (url && url.length > 100) {
    truncatedUrl = url.substring(0, 50) + '...';
  }

  const sessionId = req.headers['mcp-session-id'];
  const userId = req.userId;

  return `
  ${colorize(method, getMethodColor(method))} ${colorize(truncatedUrl, colors.white)} ${colorize(status, getStatusColor(status))} ${colorize(`${responseTime}ms`, colors.gray)} 👤 User: ${colorize(userId, colors.green)} Session: ${colorize(sessionId, colors.cyan)} 🔧 Method: ${colorize(req.body.method, colors.magenta)} Mode: ${colorize(req.query.mode, colors.yellow)}`;
};
