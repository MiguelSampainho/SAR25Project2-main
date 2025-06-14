import { Request, Response, NextFunction } from 'express';
import { expressjwt } from 'express-jwt';
import config from '../config/config';

// Extend Express Request with user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      username: string;
      userId: string;
      iat?: number;
      exp?: number;
    };
    auth?: any; // For express-jwt auth property
  }
}

// JWT authentication middleware
export const authenticate = expressjwt({
  secret: config.jwtSecret,
  algorithms: ['HS256']
});

// Add user info to request after JWT validation
export const addUserToRequest = (req: Request, res: Response, next: NextFunction): void => {
  if (req.auth) {
    // Add auth payload to request.user
    req.user = {
      username: req.auth.username,
      userId: req.auth.userId,
      iat: req.auth.iat,
      exp: req.auth.exp
    };
  }
  next();
};

// Error handler for JWT authentication
export const handleJwtError = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again.'
    });
  } else {
    next(err);
  }
};