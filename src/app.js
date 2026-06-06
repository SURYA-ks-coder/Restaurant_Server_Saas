const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const swaggerUi = require("swagger-ui-express");
const env = require("./config/env");
const swaggerSpec = require("./config/swagger");
const apiRoutes = require("./routes");
const apiRateLimiter = require("./middleware/rateLimit.middleware");
const {
  attachRequestId,
  requestLogger,
} = require("./middleware/requestLogger.middleware");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(attachRequestId);
app.use(requestLogger);
app.use(apiRateLimiter);
app.use("/uploads", express.static(path.join(process.cwd(), env.uploadDir)));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1", apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
