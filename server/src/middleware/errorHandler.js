/**
 * Centralized Error Handling Middleware
 * Guarantees no sensitive stack traces or database connection strings leak to the client.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[Error] [${req.method} ${req.url}]:`, {
    message: err.message,
    statusCode,
    stack: isProduction ? undefined : err.stack,
  });

  res.status(statusCode).json({
    error: {
      message: err.userMessage || err.message || 'An unexpected error occurred.',
      code: err.code || 'INTERNAL_SERVER_ERROR',
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}

