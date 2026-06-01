const http = require("http");
const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const connectDatabase = require("./database/connection");
const initSockets = require("./sockets");

const startServer = async () => {
  await connectDatabase();
  const server = http.createServer(app);
  initSockets(server);
  server.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  logger.error(error);
  process.exit(1);
});
