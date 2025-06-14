import { Request, Response, NextFunction } from 'express';
import config from '../config/config';

/**
 * Global error handler middleware
 * Provides consistent error responses across the application
 */
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  // Set default error code and status
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  
  // Log the error for server-side debugging
  console.error(`Error: ${statusCode} - ${err.message}`);
  console.error(`Path: ${req.originalUrl}, Method: ${req.method}`);
  
  // Different error responses for development vs production
  if (config.nodeEnv === 'development') {
    // More detailed error response in development
    res.status(statusCode).json({
      status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  } else {
    // Cleaner error response in production
    res.status(statusCode).json({
      status,
      message: err.message
    });
  }
};

export default errorHandler;