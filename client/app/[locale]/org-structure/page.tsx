import Link from "next/link";

export const metadata = {
  title: "Organizational Structure | Belimuno",
  description:
    "Explore Belimuno's organizational structure: departments and reporting lines.",
};

export default function OrgStructurePage() {
  // Direct S3 PDF (for inline viewing via PDF.js online viewer)
  const s3PdfUrl =
    "https://belimuno-uploads.s3.eu-north-1.amazonaws.com/public/pdfs/belimuno-org-structure.pdf";
  // Use Mozilla PDF.js generic viewer for robust in-browser preview
  const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
    s3PdfUrl,
  )}`;
  // Same-origin proxy for controlled download behaviour
  const pdfApiUrl = "/api/org-structure-pdf";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-wide text-white/90">
            Organizational Structure
          </h1>
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
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl overflow-hidden">
          {/* Use PDF.js hosted viewer for consistent inline preview across browsers */}
          <iframe src={viewerUrl} className="h-[calc(100vh-12rem)] w-full" />
        </div>
      </div>
    </main>
  );
}
