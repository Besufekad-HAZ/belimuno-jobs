import type { Metadata } from "next";
import { Geist_Mono, Manrope, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";
import "./fonts.css";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import ChatbotComponent from "@/chatbot/ChatbotComponent";
import { Toaster } from "@/components/ui/sonner";
import "react-chatbot-kit/build/main.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  weight: ["400", "500", "700"],
  subsets: ["ethiopic"],
});

export const metadata: Metadata = {
  title: "Belimuno Jobs - Connecting Talent with Opportunities",
  description: "HR outsourcing and job management platform for Ethiopia",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
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

  // Load messages for this locale on the server
  const messages = await getMessages();

  return (
    <div className={`${manrope.variable} ${notoEthiopic.variable} ${geistMono.variable} antialiased`}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <ChatbotComponent />
        <Footer />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </NextIntlClientProvider>
    </div>
  );
}
