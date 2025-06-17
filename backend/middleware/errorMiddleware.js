
// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥', err);
  }

  // Customize error responses based on error type
  let error = { ...err };
  error.message = err.message;

  // MongoDB ValidationError
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.values(err.errors).forEach(({ path, message }) => {
      errors[path] = message;
    });
    error = new AppError('Validation failed', 400);
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Validation failed',
      errors
    });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`Duplicate field value: ${field}. Please use another value`, 400);
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: `Duplicate field value: ${field}. Please use another value`
    });
  }

  // MongoDB CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      status: 'fail',
      message: 'Invalid token. Please log in again'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      status: 'fail',
      message: 'Token expired. Please log in again'
    });
  }

  // Default error response
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.isOperational ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { error: err, stack: err.stack })
  });
};

// Not found middleware for undefined routes
const notFound = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  notFound
};
