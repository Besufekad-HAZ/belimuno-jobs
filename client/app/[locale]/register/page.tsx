"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAuth, getRoleDashboardPath } from "@/lib/auth";
import { authAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
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
        options?: Record<string, unknown>
      ) => void;
    };
  };
};
declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "worker",
    phone: "",
    location: "",
    bio: "",
    skills: "",
    experience: "",
    hourlyRate: "",
    company: "",
    industry: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("RegisterPage");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t("errors.passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      // Prepare registration data based on role
      interface RegistrationProfile {
        phone: string;
        location: string;
        bio: string;
        skills?: string[];
        experience?: number;
        hourlyRate?: number;
        company?: string;
        industry?: string;
        website?: string;
      }

      interface RegistrationData {
        name: string;
        email: string;
        password: string;
        role: string;
        profile: RegistrationProfile;
      }

      const registrationData: RegistrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
        },
      };

      // Add role-specific fields
      if (formData.role === "worker") {
        registrationData.profile.skills = formData.skills
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        registrationData.profile.experience =
          parseInt(formData.experience) || 0;
        registrationData.profile.hourlyRate =
          parseFloat(formData.hourlyRate) || 0;
      } else if (formData.role === "client") {
        registrationData.profile.company = formData.company;
        registrationData.profile.industry = formData.industry;
        registrationData.profile.website = formData.website;
      }

      const response = await authAPI.register(
        registrationData as unknown as Record<string, unknown>
      );
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
          (error as { response: { data: { message: string } } }).response.data
            .message
        );
      } else {
        setError(t("errors.default"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Sign Up (with role)
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

  useEffect(() => {
    if (!googleReady) return;
    if (!window.google || !window.google.accounts?.id) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    if (!clientId) return;
    window.google.accounts.id!.initialize({
      client_id: clientId,
      callback: async (resp: { credential: string }) => {
        try {
          const res = await authAPI.loginWithGoogle(
            resp.credential,
            formData.role as "worker" | "client"
          );
          const { token, user } = res.data;
          setAuth(token, user);
          if (typeof window !== "undefined")
            window.dispatchEvent(new Event("authChanged"));
          router.push(getRoleDashboardPath(user.role));
        } catch (e) {
          console.error(e);
          setError(t("errors.googleSignUp"));
        }
      },
    });
    if (googleBtnRef.current) {
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id!.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signup_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    }
  }, [googleReady, formData.role, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="relative bg-white/70 backdrop-blur rounded-xl border border-gray-200 p-1 flex mt-2">
          <Link href="/login" className="flex-1">
            <div className="text-center py-2 rounded-lg font-semibold text-gray-600 hover:text-blue-700">
              {t("tabs.login")}
            </div>
          </Link>
          <Link href="/register" className="flex-1">
            <div className="text-center py-2 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow">
              {t("tabs.signup")}
            </div>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t("header.title")}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t("header.subtitle.text")}{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {t("header.subtitle.link")}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Input
              label={t("form.fields.name")}
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
            />

            <Input
              label={t("form.fields.email")}
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("form.fields.role.label")}
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="worker">
                  {t("form.fields.role.options.worker")}
                </option>
                <option value="client">
                  {t("form.fields.role.options.client")}
                </option>
              </select>
            </div>

            {/* Google Sign Up Button */}
            <div className="flex justify-center">
              <div ref={googleBtnRef} />
            </div>

            <Input
              label={t("form.fields.phone")}
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
            />

            <Input
              label={t("form.fields.location")}
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
            />

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("form.fields.bio.label")}
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t("form.fields.bio.placeholder")}
              />
            </div>

            {/* Worker-specific fields */}
            {formData.role === "worker" && (
              <>
                <Input
                  label={t("form.fields.worker.skills.label")}
                  name="skills"
                  type="text"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder={t("form.fields.worker.skills.placeholder")}
                />

                <Input
                  label={t("form.fields.worker.experience")}
                  name="experience"
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={handleChange}
                />

                <Input
                  label={t("form.fields.worker.hourlyRate")}
                  name="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                />
              </>
            )}

            {/* Client-specific fields */}
            {formData.role === "client" && (
              <>
                <Input
                  label={t("form.fields.client.company")}
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleChange}
                />

                <Input
                  label={t("form.fields.client.industry")}
                  name="industry"
                  type="text"
                  value={formData.industry}
                  onChange={handleChange}
                />

                <Input
                  label={t("form.fields.client.website")}
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                />
              </>
            )}

            <Input
              label={t("form.fields.password")}
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            <Input
              label={t("form.fields.confirmPassword")}
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            <Button type="submit" className="w-full" loading={loading}>
              {loading
                ? t("form.buttons.submit.loading")
                : t("form.buttons.submit.default")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
