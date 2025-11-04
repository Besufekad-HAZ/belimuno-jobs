const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.type("html").send(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Belimuno Jobs API</title>
      <style>
        :root { color-scheme: light dark; }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: linear-gradient(135deg, #0f172a, #1e3a8a);
          color: #f8fafc;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .card {
          background: rgba(15, 23, 42, 0.85);
          border-radius: 18px;
          padding: 32px;
          max-width: 520px;
          box-shadow: 0 40px 80px rgba(15, 23, 42, 0.35);
          border: 1px solid rgba(148, 163, 184, 0.2);
          backdrop-filter: blur(12px);
        }
        h1 {
          margin: 0 0 12px;
          font-size: 2rem;
        }
        p {
          margin: 0 0 16px;
          line-height: 1.6;
          color: #cbd5f5;
        }
        a {
          color: #38bdf8;
          text-decoration: none;
        }
        a:hover { text-decoration: underline; }
        .meta {
          margin-top: 24px;
          font-size: 0.875rem;
          color: #94a3b8;
        }
        code {
          font-family: "Fira Code", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          background: rgba(148, 163, 184, 0.15);
          padding: 0 4px;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <main class="card">
        <h1>Belimuno Jobs API</h1>
        <p>
          Welcome to the Belimuno Jobs platform API. Use the
          <a href="/api">/api</a> endpoint to explore available routes, or consult the
          project README for integration details.
        </p>
        <p>
          Authentication, worker, client, and admin features are available under the
          <code>/api</code> namespace. Ensure you include the appropriate tokens when
          accessing protected resources.
        </p>
        <div class="meta">
          Environment: ${process.env.NODE_ENV || "development"}<br />
          Health check: <a href="/api/health">/api/health</a>
        </div>
      </main>
    </body>
  </html>`);
});

module.exports = router;
