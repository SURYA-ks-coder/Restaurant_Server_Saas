const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const apiRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = apiRateLimiter;
