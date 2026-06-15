const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  appUrl: process.env.APP_URL || "http://localhost:5000",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173/", //"https://restaurant-qr-order-three.vercel.app",
  mongoUri:
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/restaurant_saas",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 5),
  rateLimit: {
    windowMinutes: Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15),
    max: Number(process.env.RATE_LIMIT_MAX || 300),
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "ap-south-1",
    s3Bucket: process.env.AWS_S3_BUCKET_NAME || "",
  },
};

module.exports = env;
