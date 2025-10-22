const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const {
  uploadObject,
  deleteObject,
  buildPublicUrl,
  resolveKeyFromUrl,
} = require("./s3Storage");

// Configure upload prefixes for videos
const VIDEO_UPLOAD_PREFIX = (process.env.AWS_S3_VIDEO_PREFIX || "public/videos")
  .replace(/^\/+/, "")
  .replace(/\/+$/, "");

// Video upload configuration
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for videos
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("video/")) {
      cb(new Error("Only video files are allowed."));
      return;
    }
    cb(null, true);
  },
});

const sanitizeVideoFilename = (rawName, fallbackPrefix = "video") => {
  if (!rawName) {
    return `${fallbackPrefix}.mp4`;
  }

  const withoutQuery = rawName.split("?")[0]?.split("#")[0] || rawName;
  const ext = path.extname(withoutQuery);
  const baseName = path.basename(withoutQuery, ext);

  const sanitizedBase = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const sanitizedExt = ext && /\.[a-zA-Z0-9]+$/.test(ext) ? ext : ".mp4";

  const finalBase = sanitizedBase || fallbackPrefix;
  return `${finalBase}${sanitizedExt}`;
};

const generateVideoObjectKey = (originalName, fallbackPrefix) => {
  const sanitizedFilename = sanitizeVideoFilename(originalName, fallbackPrefix);
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString("hex");

  return `${VIDEO_UPLOAD_PREFIX}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;
};

const deleteVideo = async (url) => {
  try {
    const managedKey = resolveKeyFromUrl(url);
    if (managedKey) {
      await deleteObject(managedKey);
    }
  } catch (error) {
    console.error("Failed to delete video from S3:", managedKey, error);
  }
};

const handleVideoUpload = (req, res, fallbackPrefix = "video") => {
  return new Promise((resolve, reject) => {
    videoUpload.single("video")(req, res, async (err) => {
      if (err) {
        let message = err.message || "Unable to upload video.";
        if (
          err.code === "LIMIT_FILE_SIZE" ||
          err.message === "File too large"
        ) {
          message = "Video exceeds the 50MB limit.";
        }
        return reject({ status: 400, message });
      }

      if (!req.file) {
        return reject({
          status: 400,
          message: "Please attach a video file in the 'video' field.",
        });
      }

      try {
        const objectKey = generateVideoObjectKey(
          req.file.originalname || `${fallbackPrefix}.mp4`,
          fallbackPrefix
        );

        await uploadObject({
          key: objectKey,
          body: req.file.buffer,
          contentType: req.file.mimetype,
          cacheControl: "public, max-age=31536000, immutable", // Cache for 1 year
        });

        const fileUrl = buildPublicUrl(objectKey);
        const filename = path.basename(objectKey);

        resolve({
          url: fileUrl,
          filename,
          size: req.file.size,
          mimeType: req.file.mimetype,
        });
      } catch (uploadError) {
        console.error("Failed to upload video to S3", uploadError);
        reject({
          status: 500,
          message:
            "We couldn't store that video right now. Please try again in a moment.",
        });
      }
    });
  });
};

module.exports = {
  videoUpload,
  handleVideoUpload,
  deleteVideo,
  generateVideoObjectKey,
};
