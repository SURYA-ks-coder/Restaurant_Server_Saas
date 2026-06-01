const mongoose = require("mongoose");
const env = require("../config/env");
const logger = require("../config/logger");

const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  logger.info("MongoDB connected");
};

module.exports = connectDatabase;
