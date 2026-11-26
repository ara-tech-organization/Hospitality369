const mongoose = require('mongoose');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid identifier';
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    details = { fields: Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message])) };
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with these details already exists';
    details = { fields: Object.fromEntries(Object.keys(err.keyValue || {}).map((k) => [k, 'Already exists'])) };
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request payload too large';
  }

  if (status >= 500) {
    console.error('[error]', err);
    if (env.isProd) message = 'An unexpected error occurred. Please try again.';
  }

  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}

module.exports = { notFound, errorHandler, ApiError };
