const morgan = require("morgan");
const { v4: uuid } = require("uuid");
const logger = require("../config/logger");

const attachRequestId = (req, res, next) => {
  req.requestId = req.headers["x-request-id"] || uuid();
  res.setHeader("x-request-id", req.requestId);
  next();
};

const requestLogger = morgan("combined", {
  stream: { write: (message) => logger.info(message.trim()) }
});

module.exports = { attachRequestId, requestLogger };
