// ANSI color codes for terminal output
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

// Helper function to get status color
export const getStatusColor = (status: string) => {
  const statusCode = parseInt(status);
  if (statusCode >= 500) return colors.red;
  if (statusCode >= 400) return colors.yellow;
  if (statusCode >= 300) return colors.cyan;
  if (statusCode >= 200) return colors.green;
  return colors.white;
};

// Helper function to get method color
export const getMethodColor = (method: string) => {
  switch (method?.toUpperCase()) {
    case 'GET':
      return colors.green;
    case 'POST':
      return colors.blue;
    case 'PUT':
      return colors.yellow;
    case 'DELETE':
      return colors.red;
    case 'PATCH':
      return colors.magenta;
    default:
      return colors.white;
  }
};

// Helper function to colorize text
export const colorize = (text: string, color: string) => {
  return `${color}${text}${colors.reset}`;
};
