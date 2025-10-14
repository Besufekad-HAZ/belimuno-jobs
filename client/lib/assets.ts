const LOCAL_HOSTNAME_PATTERNS = ["localhost", "127.", ".local"];
const DEFAULT_PUBLIC_PREFIX = "/public";
const LEGACY_BUCKET_HOSTS = new Set([
  "belimuno-uploads.s3.amazonaws.com",
  "belimuno-uploads.s3.us-east-1.amazonaws.com",
  "belimuno-uploads.s3.us-west-1.amazonaws.com",
]);
const PREFERRED_BUCKET_HOST = "belimuno-uploads.s3.eu-north-1.amazonaws.com";
const FALLBACK_UPLOADS_BASE = `https://${PREFERRED_BUCKET_HOST}${DEFAULT_PUBLIC_PREFIX}`;

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isTruthyString = (value?: string | null): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isLocalHostname = (hostname: string) => {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return false;
  return LOCAL_HOSTNAME_PATTERNS.some((pattern) => {
    if (pattern === "localhost") {
      return (
        normalized === "localhost" ||
        normalized.startsWith("localhost:") ||
        normalized.endsWith(".localhost")
      );
    }
    if (pattern === "127.") {
      return normalized === "127.0.0.1" || normalized.startsWith("127.");
    }
    if (pattern === ".local") {
      return normalized.endsWith(pattern);
    }
    return normalized === pattern;
  });
};

const ensurePublicPrefix = (pathname: string) => {
  const stripped = stripTrailingSlash(pathname || "");
  if (!stripped || stripped === "/") {
    return DEFAULT_PUBLIC_PREFIX;
  }
  if (stripped === DEFAULT_PUBLIC_PREFIX) {
    return DEFAULT_PUBLIC_PREFIX;
  }
  if (stripped.startsWith(`${DEFAULT_PUBLIC_PREFIX}/`)) {
    return stripped;
  }
  return `${DEFAULT_PUBLIC_PREFIX}${stripped.startsWith("/") ? stripped : `/${stripped}`}`;
};

const coerceUploadsBase = (raw: string) => {
  try {
    const url = new URL(raw);
    if (LEGACY_BUCKET_HOSTS.has(url.hostname)) {
      url.hostname = PREFERRED_BUCKET_HOST;
    }
    if (url.hostname === PREFERRED_BUCKET_HOST) {
      url.pathname = ensurePublicPrefix(url.pathname || "");
    }
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${stripTrailingSlash(url.pathname)}`;
  } catch {
    return raw;
  }
};

export const sanitizeBase = (value?: string | null) => {
  if (!isTruthyString(value)) return undefined;
  const trimmed = value.trim();
  const normalized = stripTrailingSlash(trimmed);

  try {
    const coalesced = coerceUploadsBase(normalized);
    const url = new URL(coalesced);
    if (isLocalHostname(url.hostname)) {
      return undefined;
    }
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${stripTrailingSlash(url.pathname)}`;
  } catch {
    return undefined;
  }
};

const getEnvValue = (key: string) => {
  if (typeof process === "undefined") return undefined;
  const env = (
    process as unknown as { env?: Record<string, string | undefined> }
  ).env;
  return env ? env[key] : undefined;
};

const stripApiSuffix = (value?: string | null) => {
  if (!value) return value ?? undefined;
  return value.replace(/\/?api\/?$/, "");
};

const ENV_CANDIDATES = [
  "NEXT_PUBLIC_UPLOADS_BASE_URL",
  "NEXT_PUBLIC_ASSET_BASE_URL",
  "NEXT_PUBLIC_FILES_BASE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "UPLOADS_BASE_URL",
  "ASSET_BASE_URL",
];

export const inferUploadsBase = () => {
  for (const key of ENV_CANDIDATES) {
    const candidate = sanitizeBase(getEnvValue(key));
    if (candidate) return candidate;
  }

  const apiCandidate = sanitizeBase(
    stripApiSuffix(getEnvValue("NEXT_PUBLIC_API_BASE_URL")),
  );
  if (apiCandidate) return apiCandidate;

  const fallbackCandidate = sanitizeBase(
    stripApiSuffix(getEnvValue("API_BASE_URL")),
  );
  if (fallbackCandidate) return fallbackCandidate;

  return FALLBACK_UPLOADS_BASE;
};

const DEFAULT_UPLOADS_BASE = inferUploadsBase();

const joinWithBase = (base: string, path: string) => {
  const normalizedBase = stripTrailingSlash(base);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${encodeURI(normalizedPath)}`;
};

const normalizeRelativePath = (raw: string) => {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (trimmed.startsWith("/")) return trimmed;
  return `/${trimmed.replace(/^\.\/+/, "")}`;
};

export const resolveAssetUrl = (raw?: string | null, base?: string | null) => {
  if (!isTruthyString(raw)) return undefined;
  const trimmed = raw.trim();
  if (trimmed.startsWith("data:")) return trimmed;

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  try {
    const candidateUrl = new URL(trimmed);
    if (isLocalHostname(candidateUrl.hostname)) {
      const uploadsBase = sanitizeBase(base) || DEFAULT_UPLOADS_BASE;
      if (!uploadsBase) {
        return normalizeRelativePath(
          `${candidateUrl.pathname}${candidateUrl.search}${candidateUrl.hash}`,
        );
      }
      return joinWithBase(
        uploadsBase,
        `${candidateUrl.pathname}${candidateUrl.search}${candidateUrl.hash}`,
      );
    }
    return candidateUrl.toString();
  } catch {
    // not an absolute URL
  }

  const uploadsBase = sanitizeBase(base) || DEFAULT_UPLOADS_BASE;

  if (trimmed.startsWith("/")) {
    if (!uploadsBase) return trimmed;
    return joinWithBase(uploadsBase, trimmed);
  }

  const relativePath = normalizeRelativePath(trimmed);
  if (!uploadsBase) {
    return relativePath;
  }
  return joinWithBase(uploadsBase, relativePath);
};

export { DEFAULT_UPLOADS_BASE };
