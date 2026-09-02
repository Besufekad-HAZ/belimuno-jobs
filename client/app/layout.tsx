import type { Metadata } from "next";
import "./[locale]/globals.css";
import "./[locale]/fonts.css";
import "react-chatbot-kit/build/main.css";
import { resolveAssetUrl } from "@/lib/assets";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const brandIcon = resolveAssetUrl("/belimuno-favicon.png?v=4") ?? "/belimuno-favicon.png?v=4";

export const metadata: Metadata = {
  title: "Belimuno Jobs - Connecting Talent with Opportunities",
  description: "HR outsourcing and job management platform for Ethiopia",
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", type: "image/x-icon", sizes: "32x32" },
      { url: brandIcon, type: "image/png", sizes: "256x256" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/favicon.ico?v=4", type: "image/x-icon" }],
    apple: [{ url: brandIcon, type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          <LoadingProvider>{children}</LoadingProvider>
        </QueryProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
