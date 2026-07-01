const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
const env = require("../config/env");
const AppError = require("../utils/AppError");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
});

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/"))
    return cb(new AppError("Only image uploads are allowed", 422));
  return cb(null, true);
};

// R2's S3-API endpoint isn't the public one, so multer-s3's auto-generated
// file.location is wrong; rebuild it from the bucket's public URL instead.
const setPublicLocation = (req, res, next) => {
  const files = req.file ? [req.file] : Object.values(req.files || {}).flat();
  files.forEach((file) => {
    file.location = `${env.r2.publicUrl.replace(/\/$/, "")}/${file.key}`;
  });
  next();
};

// Factory: returns an object exposing single/array/fields like multer, but
// each also rewrites file.location to the public R2 URL after upload.
const createUpload = (folder) => {
  const storage = multerS3({
    s3,
    bucket: env.r2.bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    // Bucket must have public access enabled (R2.dev URL or custom domain).
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${folder}/${Date.now()}-${uuid()}${ext}`);
    },
  });

  const upload = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
  });

  return {
    single: (field) => [upload.single(field), setPublicLocation],
    array: (field, maxCount) => [upload.array(field, maxCount), setPublicLocation],
    fields: (fieldsSpec) => [upload.fields(fieldsSpec), setPublicLocation],
  };
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
