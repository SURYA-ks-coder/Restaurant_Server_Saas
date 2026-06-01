const { sendError } = require("../helpers/apiResponse");
const logger = require("../config/logger");

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === "ValidationError" ? 422 : 500);
  const message = statusCode === 500 ? "Internal server error" : err.message;

  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    requestId: req.requestId
  });

  return sendError(res, {
    statusCode,
    message,
    errors: err.details || null
  });
};

module.exports = { notFound, errorHandler };
