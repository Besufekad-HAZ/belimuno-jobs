"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { setAuth, getRoleDashboardPath } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useTranslations } from "next-intl";

type GoogleIdentity = {
  accounts?: {
    id?: {
      initialize: (options: {
        client_id: string;
        callback: (resp: { credential: string }) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options?: Record<string, unknown>,
      ) => void;
    };
  };
};
declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("LoginPage");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.login(formData.email, formData.password);
      const { token, user } = response.data;

      setAuth(token, user);
      // Notify all tabs and components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("authChanged"));
      }
      router.push(getRoleDashboardPath(user.role));
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
      ) {
        setError(
          (error.response as { data: { message?: string } }).data.message ||
            t("errors.default"),
        );
      } else {
        setError(t("errors.default"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Load Google Identity script once
  useEffect(() => {
    const existing = document.getElementById("google-identity");
    if (existing) {
      setGoogleReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.id = "google-identity";
    s.onload = () => setGoogleReady(true);
    document.body.appendChild(s);
  }, []);

  // Initialize and render Google Sign-In button
  useEffect(() => {
    if (!googleReady) return;
    if (!window.google || !window.google.accounts?.id) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    if (!clientId) return;
    window.google.accounts.id!.initialize({
      client_id: clientId,
      callback: async (resp: { credential: string }) => {
        try {
          const res = await authAPI.loginWithGoogle(resp.credential);
          const { token, user } = res.data;
          setAuth(token, user);
          if (typeof window !== "undefined")
            window.dispatchEvent(new Event("authChanged"));
          router.push(getRoleDashboardPath(user.role));
        } catch (e) {
          console.error(e);
          setError(t("errors.googleSignIn"));
        }
      },
    });
    if (googleBtnRef.current) {
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id!.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    }
  }, [googleReady, router, t]);

  // Test accounts (seeded) - aligned with server/seedTestData.js
  const testAccounts = [
    {
      email: "admin1@belimuno.com",
      password: "Belimuno#2025!",
      role: "Super Admin 1",
    },
    {
      email: "admin2@belimuno.com",
      password: "Belimuno#2025!",
      role: "Super Admin 2",
    },
    {
      email: "admin.hr@belimuno.com",
      password: "Belimuno#2025!",
      role: "Admin (HR)",
    },
    {
      email: "admin.outsource@belimuno.com",
      password: "Belimuno#2025!",
      role: "Admin (Outsource)",
    },
    {
      email: "worker1@belimuno.com",
      password: "Belimuno#2025!",
      role: "Worker",
    },
    {
      email: "client1@belimuno.com",
      password: "Belimuno#2025!",
      role: "Client",
    },
  ] as const;

  const fillTestAccount = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col justify-center py-4 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 sm:w-80 h-40 sm:h-80 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 opacity-20"></div>
        <div className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-40 sm:w-80 h-40 sm:h-80 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 opacity-20"></div>
      </div>

      <div className="relative z-10 w-full">
        {/* Header Section */}
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {t("header.title")}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-2">
            {t("header.subtitle")}{" "}
            <span className="font-semibold text-blue-700">
              {t("header.brandName")}
            </span>
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            {t("header.noAccount.text")}{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              {t("header.noAccount.link")}
            </Link>
          </p>
        </div>

        {/* Auth Tabs */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="relative bg-white/70 backdrop-blur rounded-xl border border-gray-200 p-1 flex">
            <Link href="/login" className="flex-1">
              <div className="text-center py-2 rounded-lg font-semibold transition-all bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow">
                {t("tabs.login")}
              </div>
            </Link>
            <Link href="/register" className="flex-1">
              <div className="text-center py-2 rounded-lg font-semibold text-gray-600 hover:text-blue-700">
                {t("tabs.signup")}
              </div>
            </Link>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="mt-6 sm:mt-10 mx-auto w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {/* Email/Password Sign-In */}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <Input
                    label={t("form.fields.email")}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />

                  <Input
                    label={t("form.fields.password")}
                    name="password"
                    type="password"
                    showPasswordToggle
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl py-3 text-base font-semibold"
                  loading={loading}
                >
                  {loading
                    ? t("form.buttons.submit.loading")
                    : t("form.buttons.submit.default")}
                </Button>

                {/* OR Divider */}
                <div className="relative my-6">
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {t("form.divider")}
                    </span>
                  </div>
                </div>

                {/* Google Sign-In */}
                <div className="flex justify-center">
                  <div ref={googleBtnRef} />
                </div>
              </form>
            </div>

            {/* Test Accounts Section */}
            <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-gray-100">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-500 bg-gray-50">
                  {t("testAccounts.title")}
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <div className="grid gap-2">
                {testAccounts.map((account, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      fillTestAccount(account.email, account.password)
                    }
                    className="group w-full text-left px-3 sm:px-4 py-2 sm:py-3 bg-white hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-200 transition-all duration-200 hover:shadow-md transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-800 text-xs sm:text-sm group-hover:text-blue-700 transition-colors truncate">
                          {account.role}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5 truncate">
                          {account.email}
                        </div>
                      </div>
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <span className="font-medium">
                      {t("testAccounts.info.title")}
                    </span>{" "}
                    {t("testAccounts.info.description")}{" "}
                    <code className="bg-blue-100 px-1 rounded text-xs">
                      {t("testAccounts.info.command")}
                    </code>{" "}
                    {t("testAccounts.info.location")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
