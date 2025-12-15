const config = require('../config');
const AppError = require('../utils/AppError');

const handleDuplicateKeyError = (error) => {
  const match = error.detail.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
  const field = match ? match[1] : 'field';
  const value = match ? match[2] : 'value';
  return AppError.conflict(`Duplicate value: ${field} '${value}' already exists`);
};

const handleValidationError = (error) => {
  const errors = error.errors?.map((err) => ({
    field: err.path,
    message: err.msg,
  }));
  return AppError.badRequest('Validation failed', errors);
};

const handleJWTError = () => {
  return AppError.unauthorized('Invalid token. Please log in again');
};

const handleJWTExpiredError = () => {
  return AppError.unauthorized('Token expired. Please log in again');
};

const handleForeignKeyError = (error) => {
  return AppError.badRequest('Referenced resource does not exist');
};

const handleCheckConstraintError = (error) => {
  return AppError.badRequest('Invalid data: constraint violation');
};

const sendErrorDev = (error, res) => {
  res.status(error.statusCode || 500).json({
    success: false,
    status: error.status || 'error',
    message: error.message,
    errors: error.errors || null,
    stack: error.stack,
    error,
  });
};

const sendErrorProd = (error, res) => {
  // Operational, trusted error: send message to client
  if (error.isOperational) {
    res.status(error.statusCode).json({
      success: false,
      status: error.status,
      message: error.message,
      errors: error.errors || null,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR:', error);

    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

const errorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (config.env === 'development') {
    sendErrorDev(error, res);
  } else {
    let err = { ...error, message: error.message };

    // PostgreSQL duplicate key error
    if (error.code === '23505') {
      err = handleDuplicateKeyError(error);
    }

    // PostgreSQL foreign key violation
    if (error.code === '23503') {
      err = handleForeignKeyError(error);
    }

    // PostgreSQL check constraint violation
    if (error.code === '23514') {
      err = handleCheckConstraintError(error);
    }

    // express-validator errors
    if (error.type === 'validation') {
      err = handleValidationError(error);
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      err = handleJWTError();
    }

    if (error.name === 'TokenExpiredError') {
      err = handleJWTExpiredError();
    }

    sendErrorProd(err, res);
  }
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  next(AppError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
