const mongoose = require("mongoose");
const env = require("../config/env");
const logger = require("../config/logger");

const dropStaleIndexes = async () => {
  try {
    const rolesCollection = mongoose.connection.collection("roles");
    const indexes = await rolesCollection.indexes();
    const stale = indexes.find((idx) => idx.name === "restaurantId_1_name_1");
    if (stale) {
      await rolesCollection.dropIndex("restaurantId_1_name_1");
      logger.info("Dropped stale index: roles.restaurantId_1_name_1");
    }
  } catch (err) {
    logger.warn(`Index cleanup skipped: ${err.message}`);
  }
};

const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  logger.info("MongoDB connected");
  await dropStaleIndexes();
};

module.exports = connectDatabase;
