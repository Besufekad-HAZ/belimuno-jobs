import type { Metadata } from "next";
import { Geist_Mono, Manrope, Noto_Sans_Ethiopic } from "next/font/google";
import "./[locale]/globals.css";
import "./[locale]/fonts.css";
import "react-chatbot-kit/build/main.css";

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

export const metadata: Metadata = {
  title: "Belimuno Jobs - Connecting Talent with Opportunities",
  description: "HR outsourcing and job management platform for Ethiopia",
  icons: {
    icon: [{ url: "/belimuno-logo.png", type: "image/svg+xml" }],
    shortcut: [{ url: "/belimuno-logo.png", type: "image/svg+xml" }],
    apple: [{ url: "/belimuno-logo.png", type: "image/svg+xml" }],
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
