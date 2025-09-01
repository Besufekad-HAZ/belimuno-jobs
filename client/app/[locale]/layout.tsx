import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./fonts.css";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import ChatbotComponent from "@/chatbot/ChatbotComponent";
import "react-chatbot-kit/build/main.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Belimuno Jobs - Connecting Talent with Opportunities",
  description: "HR outsourcing and job management platform for Ethiopia",
  icons: {
    icon: [
      { url: "/belimuno.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/belimuno.png?v=2", type: "image/png", sizes: "192x192" },
    ],
    shortcut: [
      { url: "/belimuno.png?v=2", type: "image/png" },
    ],
    apple: [
      { url: "/belimuno.png?v=2", type: "image/png", sizes: "180x180" },
    ],
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider>
          <Navbar />
          {children}
          <ChatbotComponent />
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
