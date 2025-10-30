import { NextRequest } from "next/server";

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

export async function GET(req: NextRequest) {
  try {
    const apiBase = resolveApiBase();
    const metaRes = await fetch(`${apiBase}/public/org-structure`, {
      cache: "no-store",
    });

    if (!metaRes.ok) {
      const status = metaRes.status === 404 ? 404 : 502;
      return new Response("PDF metadata not found", { status });
    }

    const metaJson = await metaRes.json();
    const pdfData = metaJson?.data;
    const pdfUrl = pdfData?.url;
    const fileName = pdfData?.filename || "belimuno-org-structure.pdf";

    if (!pdfUrl) {
      return new Response("PDF not configured", { status: 404 });
    }

    const search = new URL(req.url).searchParams;
    const shouldDownload = search.get("download");

    const res = await fetch(pdfUrl, {
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
      `${disposition}; filename="${fileName}"`,
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
