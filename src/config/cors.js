const env = require("./env");

const normalize = (url) => (url || "").replace(/\/$/, "");

const allowedOrigins = [
  env.clientUrl,
  "http://localhost:3000",
  "http://localhost:5173",
  "https://restaurant-ui-saas-ruddy.vercel.app/",
  "https://my-app-livid-ten-32.vercel.app/",
]
  .filter(Boolean)
  .map(normalize);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return allowedOrigins.includes(normalize(origin));
};

module.exports = { allowedOrigins, isOriginAllowed };
