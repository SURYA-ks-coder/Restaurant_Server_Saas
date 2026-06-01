const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const env = require("../config/env");
const AppError = require("../utils/AppError");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(env.uploadDir, { recursive: true });
    cb(null, env.uploadDir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${uuid()}${path.extname(file.originalname)}`)
});

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) return cb(new AppError("Only image uploads are allowed", 422));
  return cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 }
});

module.exports = { uploadImage };
