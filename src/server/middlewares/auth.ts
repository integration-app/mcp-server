import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  [key: string]: any;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const queryToken = req.query.token as string;

  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const userAccessToken = queryToken || headerToken;

  if (!userAccessToken) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.decode(userAccessToken) as TokenPayload;

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }

    // token is the standard access token on membrane
    req.token = userAccessToken;

    // userId is the id of the user in your database
    req.userId = decoded.id;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
