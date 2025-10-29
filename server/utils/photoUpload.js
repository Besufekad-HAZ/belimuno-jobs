const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const {
  uploadObject,
  deleteObject,
  buildPublicUrl,
  resolveKeyFromUrl,
} = require("./s3Storage");

// Configure upload prefixes for different entities
const UPLOAD_PREFIXES = {
  team: (process.env.AWS_S3_TEAM_PREFIX || "public/team")
    .replace(/^\/+/, "")
    .replace(/\/+$/, ""),
  news: (process.env.AWS_S3_NEWS_PREFIX || "public/news")
    .replace(/^\/+/, "")
    .replace(/\/+$/, ""),
  client: (process.env.AWS_S3_CLIENT_PREFIX || "public/client")
    .replace(/^\/+/, "")
    .replace(/\/+$/, ""),
  trustedCompany: (
    process.env.AWS_S3_TRUSTED_COMPANY_PREFIX || "public/trusted-companies"
  )
    .replace(/^\/+/, "")
    .replace(/\/+$/, ""),
};

// Generic file upload configuration
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed."));
      return;
    }
    cb(null, true);
  },
});

const sanitizeFilename = (rawName, fallbackPrefix = "photo") => {
  if (!rawName) {
    return `${fallbackPrefix}.jpg`;
  }

  const withoutQuery = rawName.split("?")[0]?.split("#")[0] || rawName;
  const ext = path.extname(withoutQuery);
  const baseName = path.basename(withoutQuery, ext);

  const sanitizedBase = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const sanitizedExt = ext && /\.[a-zA-Z0-9]+$/.test(ext) ? ext : ".jpg";

  const finalBase = sanitizedBase || fallbackPrefix;
  return `${finalBase}${sanitizedExt}`;
};

const generateObjectKey = (originalName, entityType, fallbackPrefix) => {
  const sanitizedName = sanitizeFilename(originalName, fallbackPrefix);
  const ext = path.extname(sanitizedName) || ".jpg";
  const base = path.basename(sanitizedName, ext);
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const combined = `${uniqueSuffix}-${base}`
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const finalBase = combined || `${uniqueSuffix}-${fallbackPrefix}`;
  const normalizedExt = ext || ".jpg";

  const prefix = UPLOAD_PREFIXES[entityType] || "public/uploads";
  return `${prefix}/${finalBase}${normalizedExt}`;
};

const stripKnownPrefixes = (value, entityType) => {
  if (!value) {
    return value;
  }

  const normalized = value.replace(/^\/+/, "");
  const prefix = UPLOAD_PREFIXES[entityType];
  const prefixPattern = new RegExp(`^${prefix}/`, "i");

  if (prefixPattern.test(normalized)) {
    return normalized.slice(prefix.length + 1); // +1 for the trailing slash
  }

  return normalized;
};

const normalizePhotoKey = (rawKey, entityType) => {
  if (!rawKey) {
    return undefined;
  }

  const filename = stripKnownPrefixes(rawKey, entityType);
  if (!filename) {
    return undefined;
  }

  const prefix = UPLOAD_PREFIXES[entityType] || "public/uploads";
  return `${prefix}/${sanitizeFilename(filename)}`;
};

const inferManagedPhotoKey = (url, entityType) => {
  if (!url || typeof url !== "string") {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  const prefix = UPLOAD_PREFIXES[entityType];
  const prefixPattern = new RegExp(`/${prefix}/`, "i");

  if (!prefixPattern.test(trimmed.toLowerCase())) {
    const resolvedKey = resolveKeyFromUrl(trimmed);
    if (!resolvedKey) {
      return undefined;
    }
    const normalizedKey = resolvedKey.replace(/^\/+/, "");
    if (!prefixPattern.test(normalizedKey.toLowerCase())) {
      return undefined;
    }
    return normalizePhotoKey(normalizedKey, entityType);
  }

  return normalizePhotoKey(trimmed, entityType);
};

const deletePhoto = async (photoKey, entityType) => {
  const managedKey =
    normalizePhotoKey(photoKey, entityType) ||
    inferManagedPhotoKey(photoKey, entityType);

  if (!managedKey) {
    return;
  }

  try {
    await deleteObject(managedKey);
  } catch (error) {
    console.warn(`Failed to delete ${entityType} photo`, managedKey, error);
  }
};

const handlePhotoUpload = (req, res, entityType, fallbackPrefix) => {
  return new Promise((resolve, reject) => {
    photoUpload.single("photo")(req, res, async (err) => {
      if (err) {
        let message = err.message || "Unable to upload photo.";
        if (
          err.code === "LIMIT_FILE_SIZE" ||
          err.message === "File too large"
        ) {
          message = "Image exceeds the 5MB limit.";
        }
        return reject({ status: 400, message });
      }

      if (!req.file) {
        return reject({
          status: 400,
          message: "Please attach an image file in the 'photo' field.",
        });
      }

      try {
        const objectKey = generateObjectKey(
          req.file.originalname || `${fallbackPrefix}.jpg`,
          entityType,
          fallbackPrefix
        );

        await uploadObject({
          key: objectKey,
          body: req.file.buffer,
          contentType: req.file.mimetype,
        });

        const fileUrl = buildPublicUrl(objectKey);
        const filename = path.basename(objectKey);

        // Only return the full URL, not the key
        resolve({
          url: fileUrl,
          filename,
          size: req.file.size,
          mimeType: req.file.mimetype,
        });
      } catch (uploadError) {
        console.error(
          `Failed to upload ${entityType} photo to S3`,
          uploadError
        );
        reject({
          status: 500,
          message:
            "We couldn't store that image right now. Please try again in a moment.",
        });
      }
    });
  });
};

module.exports = {
  photoUpload,
  handlePhotoUpload,
  deletePhoto,
  normalizePhotoKey,
  inferManagedPhotoKey,
  UPLOAD_PREFIXES,
};
