import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

type RemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
};

const toRemotePattern = (value?: string | null): RemotePattern | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    const protocol = url.protocol.replace(":", "");
    if (protocol !== "http" && protocol !== "https") {
      return undefined;
    }

    const pattern: RemotePattern = {
      protocol,
      hostname: url.hostname,
    };

    if (url.port) {
      pattern.port = url.port;
    }

    return pattern;
  } catch {
    const hostMatch = trimmed.match(/^([\w.-]+)(?::(\d+))?$/);
    if (!hostMatch) return undefined;
    const [, hostname, port] = hostMatch;
    const isLocalHost =
      hostname === "localhost" ||
      hostname.startsWith("localhost:") ||
      hostname.startsWith("127.");
    const pattern: RemotePattern = {
      protocol: isLocalHost ? "http" : "https",
      hostname,
    };
    if (port) pattern.port = port;
    return pattern;
  }
};

const registerPatterns = (values: Array<string | undefined | null>) => {
  const patterns: RemotePattern[] = [];
  const seen = new Set<string>();

  const push = (pattern?: RemotePattern) => {
    if (!pattern) return;
    const key = `${pattern.protocol}://${pattern.hostname}:${pattern.port ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    patterns.push(pattern);
  };

  values.forEach((value) => push(toRemotePattern(value)));

  return patterns;
};

const additionalHosts = process.env.NEXT_PUBLIC_UPLOADS_ALLOWED_HOSTS;
const extraCandidates = additionalHosts
  ? additionalHosts
      .split(/[,\s]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  : [];

const FALLBACK_UPLOAD_HOST =
  "https://belimuno-uploads.s3.eu-north-1.amazonaws.com/public";

const candidateValues = [
  "https://lh3.googleusercontent.com",
  process.env.NEXT_PUBLIC_UPLOADS_BASE_URL,
  process.env.NEXT_PUBLIC_ASSET_BASE_URL,
  process.env.NEXT_PUBLIC_FILES_BASE_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_API_BASE_URL,
  process.env.UPLOADS_BASE_URL,
  process.env.ASSET_BASE_URL,
  process.env.API_BASE_URL,
  "https://belimuno-jobs.onrender.com",
  "http://localhost:5000",
  FALLBACK_UPLOAD_HOST,
  ...extraCandidates,
];

const remotePatterns = registerPatterns(candidateValues);

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default withNextIntl(nextConfig);
