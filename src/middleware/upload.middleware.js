const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
const env = require("../config/env");
const AppError = require("../utils/AppError");

const s3 = new S3Client({
  region: env.aws.region,
  credentials: {
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  },
});

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/"))
    return cb(new AppError("Only image uploads are allowed", 422));
  return cb(null, true);
};

// Factory: returns a multer instance that uploads to the given S3 folder.
// file.location on the request object will contain the full public S3 URL.
const createUpload = (folder) => {
  const storage = multerS3({
    s3,
    bucket: env.aws.s3Bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    // Bucket must allow public read via bucket policy (not per-object ACL).
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${folder}/${Date.now()}-${uuid()}${ext}`);
    },
  });

  return multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
  });
};

const menuItemUpload = createUpload("menu-items");
const categoryUpload = createUpload("categories");
const restaurantLogoUpload = createUpload("restaurants");
const supplierUpload = createUpload("suppliers");
const staffUpload = createUpload("staff");

// Generic fallback kept for any route that hasn't been migrated yet.
const uploadImage = createUpload("uploads");

module.exports = {
  uploadImage,
  menuItemUpload,
  categoryUpload,
  restaurantLogoUpload,
  supplierUpload,
  staffUpload,
  createUpload,
};
