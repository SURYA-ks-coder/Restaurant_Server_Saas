const { sendError } = require("../helpers/apiResponse");
const logger = require("../config/logger");

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const resolveStatusCode = (err) => {
  if (err.statusCode) return err.statusCode;
  if (err.name === "ValidationError") return 422;
  if (err.name === "CastError") return 400;
  if (err.name === "MulterError") return 400;
  if (err.code === 11000) return 409;
  return 500;
};

const resolveMulterMessage = (err) => {
  if (err.code === "LIMIT_UNEXPECTED_FILE")
    return `Unexpected file field "${err.field}"`;
  if (err.code === "LIMIT_FILE_SIZE") return "Uploaded file is too large";
  return err.message;
};

const resolveDuplicateKeyMessage = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  return field ? `${field} already exists` : "Duplicate value";
};

const errorHandler = (err, req, res, next) => {
  const statusCode = resolveStatusCode(err);
  let message;
  if (statusCode === 500) {
    message = "Internal server error";
  } else if (err.code === 11000) {
    message = resolveDuplicateKeyMessage(err);
  } else if (err.name === "MulterError") {
    message = resolveMulterMessage(err);
  } else {
    message = err.message;
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    requestId: req.requestId,
  });

  return sendError(res, {
    statusCode,
    message,
    errors: err.details || null,
  });
};

module.exports = { notFound, errorHandler };
