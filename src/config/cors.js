const env = require("./env");

const normalize = (url) => (url || "").replace(/\/$/, "");

const allowedOrigins = [
  env.clientUrl,
  "http://localhost:3000",
  "http://localhost:5173",
]
  .filter(Boolean)
  .map(normalize);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return allowedOrigins.includes(normalize(origin));
};

module.exports = { allowedOrigins, isOriginAllowed };
