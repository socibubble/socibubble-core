/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);
  
  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: 'Duplicate entry',
          detail: err.detail
        });
      
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Referenced record does not exist',
          detail: err.detail
        });
      
      case '23502': // Not null violation
        return res.status(400).json({
          error: 'Required field missing',
          detail: err.detail
        });
      
      default:
        return res.status(500).json({
          error: 'Database error',
          code: err.code
        });
    }
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
}
