import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include token
declare global {
  namespace Express {
    interface Request {
      token?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check for token in query parameters
  const queryToken = req.query.token as string;

  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const token = queryToken || headerToken;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Add token to request object
  req.token = token;
  next();
};
