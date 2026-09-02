import type { Metadata } from "next";
import "./[locale]/globals.css";
import "./[locale]/fonts.css";
import "react-chatbot-kit/build/main.css";
import { resolveAssetUrl } from "@/lib/assets";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const brandIcon = resolveAssetUrl("/belimuno-logo.png") ?? "/belimuno-logo.png";

export const metadata: Metadata = {
  title: "Belimuno Jobs - Connecting Talent with Opportunities",
  description: "HR outsourcing and job management platform for Ethiopia",
  icons: {
    icon: [{ url: brandIcon, type: "image/svg+xml" }],
    shortcut: [{ url: brandIcon, type: "image/svg+xml" }],
    apple: [{ url: brandIcon, type: "image/svg+xml" }],
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
