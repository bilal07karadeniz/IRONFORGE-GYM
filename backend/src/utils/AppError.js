class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory methods
AppError.badRequest = (message = 'Bad request', errors = null) => {
  return new AppError(message, 400, errors);
};

AppError.unauthorized = (message = 'Unauthorized') => {
  return new AppError(message, 401);
};

AppError.forbidden = (message = 'Forbidden') => {
  return new AppError(message, 403);
};

AppError.notFound = (message = 'Resource not found') => {
  return new AppError(message, 404);
};

AppError.conflict = (message = 'Conflict') => {
  return new AppError(message, 409);
};

AppError.tooManyRequests = (message = 'Too many requests') => {
  return new AppError(message, 429);
};

AppError.internal = (message = 'Internal server error') => {
  return new AppError(message, 500);
};

module.exports = AppError;
