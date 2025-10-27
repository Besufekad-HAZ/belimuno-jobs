import { NextRequest } from "next/server";

// Remote S3 PDF URL provided by user
const REMOTE_PDF_URL =
  "https://belimuno-uploads.s3.eu-north-1.amazonaws.com/public/pdfs/belimuno-org-structure.pdf";

export async function GET(req: NextRequest) {
  try {
    const search = new URL(req.url).searchParams;
    const shouldDownload = search.get("download");

    const res = await fetch(REMOTE_PDF_URL, {
      // Use force-cache or revalidate as needed; keeping dynamic-friendly and fresh here
      cache: "no-store",
    });

    if (!res.ok || !res.body) {
      return new Response("PDF not found", { status: 404 });
    }

    const headers = new Headers();
    // Always serve as PDF for consistent browser behavior
    headers.set("content-type", "application/pdf");

    // Inline for preview; attachment when explicitly requested
    const disposition = shouldDownload ? "attachment" : "inline";
    headers.set(
      "content-disposition",
      `${disposition}; filename="belimuno-org-structure.pdf"`,
    );

    // Allow caching for a short time to improve UX
    headers.set("cache-control", "public, max-age=600");

    return new Response(res.body, {
      status: 200,
      headers,
    });
  } catch {
    return new Response("Failed to load PDF", { status: 500 });
  }
}
