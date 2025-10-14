import type { Metadata } from "next";
import { Geist_Mono, Manrope, Noto_Sans_Ethiopic } from "next/font/google";
// @ts-expect-error: side-effect CSS import from dynamic route folder ([locale])
import "./[locale]/globals.css";
// @ts-expect-error: side-effect CSS import from dynamic route folder ([locale])
import "./[locale]/fonts.css";
// @ts-expect-error: third-party package CSS without declarations
import "react-chatbot-kit/build/main.css";
import { resolveAssetUrl } from "@/lib/assets";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const notoEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  weight: ["400", "500", "700"],
  subsets: ["ethiopic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${manrope.variable} ${notoEthiopic.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
