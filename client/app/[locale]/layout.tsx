import type { Metadata } from "next";
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
import { resolveAssetUrl } from "@/lib/assets";

const brandIcon = resolveAssetUrl("/belimuno-logo.png") ?? "/belimuno-logo.png";

export const metadata: Metadata = {
  title: "Belimuno Jobs - Connecting Talent with Opportunities",
  description: "HR outsourcing and job management platform for Ethiopia",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [{ url: brandIcon, type: "image/png" }],
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
    <div className="antialiased">
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
