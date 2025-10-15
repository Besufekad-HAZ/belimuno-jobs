const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const requiredEnv = (value, name) => {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

const REGION = process.env.AWS_S3_REGION || process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.AWS_S3_BUCKET;
const ENDPOINT = process.env.AWS_S3_ENDPOINT;
const FORCE_PATH_STYLE = `${process.env.AWS_S3_FORCE_PATH_STYLE || ""}`
  .toLowerCase()
  .trim() === "true";
const PUBLIC_BASE_URL = process.env.AWS_S3_PUBLIC_BASE_URL;

let cachedClient;

const getClient = () => {
  if (!cachedClient) {
    const config = { region: REGION };

    if (ENDPOINT) {
      config.endpoint = ENDPOINT;
    }

    if (FORCE_PATH_STYLE) {
      config.forcePathStyle = true;
    }

    cachedClient = new S3Client(config);
  }

  return cachedClient;
};

const buildPublicUrl = (key) => {
  if (!key) {
    return undefined;
  }

  const normalizedKey = key.replace(/^\/+/, "");

  if (PUBLIC_BASE_URL) {
    const trimmed = PUBLIC_BASE_URL.replace(/\/+$/, "");
    const lowerBase = trimmed.toLowerCase();
    const lowerKey = normalizedKey.toLowerCase();

    if (lowerBase.endsWith("/public") && lowerKey.startsWith("public/")) {
      const strippedKey = normalizedKey.slice("public/".length);
      return `${trimmed}/${encodeURI(strippedKey)}`;
    }

    return `${trimmed}/${encodeURI(normalizedKey)}`;
  }

  const bucket = requiredEnv(BUCKET, "AWS_S3_BUCKET");
  const regionSegment = REGION ? `.${REGION}` : "";
  return `https://${bucket}.s3${regionSegment}.amazonaws.com/${encodeURI(normalizedKey)}`;
};

const uploadObject = async ({ key, body, contentType, cacheControl }) => {
  const bucket = requiredEnv(BUCKET, "AWS_S3_BUCKET");
  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream",
      CacheControl: cacheControl || "public, max-age=31536000, immutable",
    }),
  );

  return {
    key,
    url: buildPublicUrl(key),
  };
};

const deleteObject = async (key) => {
  if (!key) {
    return;
  }

  const bucket = requiredEnv(BUCKET, "AWS_S3_BUCKET");
  const client = getClient();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  } catch (error) {
    const statusCode = error?.$metadata?.httpStatusCode;
    if (statusCode === 404 || statusCode === 400) {
      return;
    }
    throw error;
  }
};

const resolveKeyFromUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") {
    return undefined;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);

    if (PUBLIC_BASE_URL) {
      const baseUrl = new URL(PUBLIC_BASE_URL);
      if (url.origin === baseUrl.origin) {
        const basePath = baseUrl.pathname.replace(/\/+$/, "");
        let relativePath = url.pathname;
        if (basePath && relativePath.startsWith(basePath)) {
          relativePath = relativePath.slice(basePath.length);
        }
        return relativePath.replace(/^\/+/, "");
      }
    }

    if (!BUCKET) {
      return undefined;
    }

    const variants = new Set([
      `${BUCKET}.s3.amazonaws.com`,
      `${BUCKET}.s3.${REGION}.amazonaws.com`,
    ]);

    if (variants.has(url.host)) {
      return url.pathname.replace(/^\/+/, "");
    }
  } catch (_error) {
    return undefined;
  }

  return undefined;
};

module.exports = {
  getClient,
  uploadObject,
  deleteObject,
  buildPublicUrl,
  resolveKeyFromUrl,
};
