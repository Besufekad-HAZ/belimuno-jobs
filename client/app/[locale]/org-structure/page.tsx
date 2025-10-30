import Link from "next/link";

export const metadata = {
  title: "Organizational Structure | Belimuno",
  description:
    "Explore Belimuno's organizational structure: departments and reporting lines.",
};

type OrgStructureMeta = {
  id?: string;
  filename?: string;
  url?: string;
  size?: number;
  contentType?: string;
  updatedAt?: string;
  createdAt?: string;
  version?: number;
};

const resolveApiBase = () => {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envBase) {
    return envBase.replace(/\/$/, "");
  }
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL.replace(/\/$/, "");
  }
  return "http://localhost:5000/api";
};

const fetchOrgStructure = async (): Promise<OrgStructureMeta | null> => {
  const apiBase = resolveApiBase();
  try {
    const res = await fetch(`${apiBase}/public/org-structure`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data?.data ?? null;
  } catch (error) {
    console.error("Failed to load organizational structure metadata", error);
    return null;
  }
};

const formatBytes = (size?: number) => {
  if (!size || size <= 0) {
    return null;
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const display =
    value < 10 && unitIndex > 0 ? value.toFixed(1) : value.toFixed(0);
  return `${display} ${units[unitIndex]}`;
};

export default async function OrgStructurePage() {
  const orgStructure = await fetchOrgStructure();

  const pdfUrl = orgStructure?.url || null;
  const pdfApiUrl = "/api/org-structure-pdf";
  const viewerUrl = pdfUrl
    ? `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
        pdfUrl,
      )}`
    : null;
  const lastUpdated = orgStructure?.updatedAt || orgStructure?.createdAt;
  const readableSize = formatBytes(orgStructure?.size);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide text-white/90">
              Organizational Structure
            </h1>
            {lastUpdated && (
              <p className="mt-1 text-sm text-white/60">
                Last updated {new Date(lastUpdated).toLocaleString()}
                {readableSize ? ` · ${readableSize}` : ""}
              </p>
            )}
          </div>
          {viewerUrl ? (
            <div className="flex items-center gap-2">
              <Link
                href={viewerUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center rounded-md border border-white/20 bg-gradient-to-r from-cyan-500/90 to-blue-600/90 px-4 py-2 text-sm font-semibold text-white shadow shadow-cyan-900/20 transition hover:from-cyan-400 hover:to-blue-500"
              >
                Open in new tab
              </Link>
              <a
                href={`${pdfApiUrl}?download=1`}
                className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/15"
              >
                Download PDF
              </a>
            </div>
          ) : (
            <div className="text-sm text-white/70">
              Organizational structure PDF is not available at the moment.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl overflow-hidden">
          {viewerUrl ? (
            <iframe
              src={viewerUrl}
              className="h-[calc(100vh-12rem)] w-full"
              title="Belimuno organizational structure"
            />
          ) : (
            <div className="flex h-[calc(100vh-12rem)] w-full items-center justify-center bg-slate-950/40 px-6 text-center text-white/70">
              <div>
                <p className="text-lg font-semibold">PDF unavailable</p>
                <p className="mt-2 text-sm">
                  The organizational structure document will appear here once
                  the super admin uploads it.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
