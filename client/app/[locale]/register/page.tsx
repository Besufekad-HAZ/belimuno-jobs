"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAuth, getRoleDashboardPath } from "@/lib/auth";
import { authAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useTranslations } from "next-intl";
import AuthBackdrop from "@/components/ui/AuthBackdrop";

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

const REGIONS = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul",
  "Gambela",
  "Harari",
  "Oromia",
  "Sidama",
  "Somali",
  "South Ethiopia",
  "Southwest Ethiopia",
  "Tigray",
  "Central Ethiopia",
  "Dire Dawa",
];

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "worker",
    phone: "",
    city: "",
    profession: "",
    experience: "",
    bio: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = useTranslations("RegisterPage");

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: "" } as const;
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    const strengthText =
      (
        {
          0: "Very Weak",
          1: "Very Weak",
          2: "Weak",
          3: "Good",
          4: "Strong",
          5: "Very Strong",
        } as const
      )[score] || "";

    return { score, text: strengthText, checks } as const;
  };

  const validateField = (name: string, value: string) => {
    const errors: string[] = [];

    switch (name) {
      case "name":
        if (!value || value.trim().length < 2) {
          errors.push("Name must be at least 2 characters long");
        }
        if (value && value.trim().length > 50) {
          errors.push("Name must be no more than 50 characters long");
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || !emailRegex.test(value)) {
          errors.push("Please provide a valid email address");
        }
        break;
      case "password":
        if (!value || value.length < 8) {
          errors.push("Password must be at least 8 characters long");
        }
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (value && !passwordRegex.test(value)) {
          errors.push(
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
          );
        }
        break;
      case "confirmPassword":
        if (value !== formData.password) {
          errors.push("Passwords do not match");
        }
        break;
    }

    return errors;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === "password" || name === "confirmPassword" || name === "email") {
      setTimeout(() => {
        const errors = validateField(name, value);
        if (errors.length > 0) {
          setFieldErrors((prev) => ({ ...prev, [name]: errors[0] }));
        } else {
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
          });
        }
      }, 500);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name || formData.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    if (formData.name && formData.name.trim().length > 50) {
      errors.push("Name must be no more than 50 characters long");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.push("Please provide a valid email address");
    }

    if (!formData.password || formData.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (formData.password && !passwordRegex.test(formData.password)) {
      errors.push(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
      );
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      setLoading(false);
      return;
    }

    try {
      interface RegistrationProfile {
        phone?: string;
        bio?: string;
        profession?: string;
        experience?: string;
        address?: { city?: string };
      }

      interface RegistrationData {
        name: string;
        email: string;
        password: string;
        role: string;
        profile?: RegistrationProfile;
      }

      const registrationData: RegistrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "worker",
        profile: {
          phone: formData.phone || undefined,
          bio: formData.bio || undefined,
          profession: formData.profession || undefined,
          experience: formData.experience || undefined,
          address: {
            city: formData.city || undefined,
          },
        },
      };

      const response = await authAPI.register(
        registrationData as unknown as Record<string, unknown>,
      );
      const { token, user } = response.data;

      setAuth(token, user);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("authChanged"));
      }

      if (user.role === "worker") {
        router.push("/profile/cv-builder");
      } else {
        router.push(getRoleDashboardPath(user.role));
      }
    } catch (error: unknown) {
      const maybeAxios = error as {
        response?: { data?: { message?: string } };
      };
      if (maybeAxios?.response?.data?.message) {
        setError(maybeAxios.response.data.message as string);
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

  // Initialize and render Google Sign-Up button
  useEffect(() => {
    if (!googleReady) return;
    if (!window.google || !window.google.accounts?.id) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    if (!clientId) return;
    window.google.accounts.id!.initialize({
      client_id: clientId,
      callback: async (resp: { credential: string }) => {
        try {
          const res = await authAPI.loginWithGoogle(resp.credential, "worker");
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
  }, [googleReady, router, t]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0E4AA1] via-[#0D63C6] to-[#0E4AA1] flex flex-col justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <AuthBackdrop />

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
                d="M12 11c.9 0 1.7-.3 2.4-.8l2.1 2.1a1 1 0 001.4-1.4l-2.1-2.1c.5-.7.8-1.5.8-2.4A5 5 0 1012 11z"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow">
            {t("header.title")}
          </h2>
          <p className="text-base sm:text-lg text-blue-50/90 mb-2">
            {t("header.subtitle.text")}{" "}
            <Link
              href="/login"
              className="font-semibold text-white underline decoration-white/60 hover:decoration-white"
            >
              {t("header.subtitle.link")}
            </Link>
          </p>
        </div>

        {/* Auth Tabs */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl lg:max-w-3xl">
          <div className="relative bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-1 flex shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
            <Link href="/login" className="flex-1">
              <div className="text-center py-2 rounded-lg font-semibold text-blue-50/80 hover:text-white">
                {t("tabs.login")}
              </div>
            </Link>
            <Link href="/register" className="flex-1">
              <div className="text-center py-2 rounded-lg font-semibold transition-all bg-white/20 text-white shadow-inner">
                {t("tabs.signup")}
              </div>
            </Link>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="mt-6 sm:mt-10 mx-auto w-full sm:max-w-3xl lg:max-w-4xl">
          <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] border border-white/20 overflow-hidden ring-1 ring-white/10">
            <div className="h-1 w-full bg-gradient-to-r from-white/60 via-white/30 to-white/60" />
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                onSubmit={handleSubmit}
              >
                {error && (
                  <div className="bg-red-50/70 border border-red-300/70 text-red-800 px-4 py-3 rounded-lg md:col-span-2">
                    {error}
                  </div>
                )}

                <div className="md:col-span-1">
                  <Input
                    label={t("form.fields.name")}
                    labelClassName="text-white"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={fieldErrors.name ? "border-red-500" : ""}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-sm text-red-200">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <Input
                    label={t("form.fields.email")}
                    labelClassName="text-white"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={fieldErrors.email ? "border-red-500" : ""}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-200">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <Input
                    label={t("form.fields.password")}
                    labelClassName="text-white"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={fieldErrors.password ? "border-red-500" : ""}
                    showPasswordToggle
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-200">
                      {fieldErrors.password}
                    </p>
                  )}

                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => {
                            const passwordStrength = getPasswordStrength(
                              formData.password,
                            );
                            return (
                              <div
                                key={level}
                                className={`h-2 w-8 rounded ${
                                  level <= passwordStrength.score
                                    ? passwordStrength.score <= 2
                                      ? "bg-red-500"
                                      : passwordStrength.score <= 3
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    : "bg-white/30"
                                }`}
                              />
                            );
                          })}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            getPasswordStrength(formData.password).score <= 2
                              ? "text-red-200"
                              : getPasswordStrength(formData.password).score <=
                                  3
                                ? "text-yellow-200"
                                : "text-green-200"
                          }`}
                        >
                          {getPasswordStrength(formData.password).text}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-white/80">
                        <p className="font-medium">Password must contain:</p>
                        <ul className="mt-1 space-y-1">
                          <li
                            className={`flex items-center ${formData.password.length >= 8 ? "text-green-200" : "text-white/70"}`}
                          >
                            <span className="mr-2">
                              {formData.password.length >= 8 ? "✓" : "○"}
                            </span>
                            At least 8 characters
                          </li>
                          <li
                            className={`flex items-center ${/[a-z]/.test(formData.password) ? "text-green-200" : "text-white/70"}`}
                          >
                            <span className="mr-2">
                              {/[a-z]/.test(formData.password) ? "✓" : "○"}
                            </span>
                            One lowercase letter
                          </li>
                          <li
                            className={`flex items-center ${/[A-Z]/.test(formData.password) ? "text-green-200" : "text-white/70"}`}
                          >
                            <span className="mr-2">
                              {/[A-Z]/.test(formData.password) ? "✓" : "○"}
                            </span>
                            One uppercase letter
                          </li>
                          <li
                            className={`flex items-center ${/\d/.test(formData.password) ? "text-green-200" : "text-white/70"}`}
                          >
                            <span className="mr-2">
                              {/\d/.test(formData.password) ? "✓" : "○"}
                            </span>
                            One number
                          </li>
                          <li
                            className={`flex items-center ${/[@$!%*?&]/.test(formData.password) ? "text-green-200" : "text-white/70"}`}
                          >
                            <span className="mr-2">
                              {/[@$!%*?&]/.test(formData.password) ? "✓" : "○"}
                            </span>
                            One special character (@$!%*?&)
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-1">
                  <Input
                    label={t("form.fields.confirmPassword")}
                    labelClassName="text-white"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={
                      fieldErrors.confirmPassword ? "border-red-500" : ""
                    }
                    showPasswordToggle
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-200">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <Input
                    label="Phone Number"
                    labelClassName="text-white"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+251 9XX XXX XXXX"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-white mb-2">
                    Region / City
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="" className="text-gray-900">
                      Select a region
                    </option>
                    {REGIONS.map((region) => (
                      <option
                        key={region}
                        value={region}
                        className="text-gray-900"
                      >
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1">
                  <Input
                    label="Profession"
                    labelClassName="text-white"
                    name="profession"
                    type="text"
                    value={formData.profession}
                    onChange={handleChange}
                    placeholder="e.g., Software Engineer, Teacher"
                  />
                </div>

                <div className="md:col-span-1">
                  <Input
                    label="Years of Experience"
                    labelClassName="text-white"
                    name="experience"
                    type="text"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g., 0-1 years, 2-5 years"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Professional Summary
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief description of your professional background and skills..."
                    className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-2 justify-center items-center">
                  {/* Create Account button */}
                  <Button
                    type="submit"
                    className="w-full max-w-xs"
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
                      <div className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-transparent text-blue-50/90">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Google Sign Up Button */}
                  <div className="flex justify-center items-center w-full max-w-xs">
                    <div ref={googleBtnRef} className="w-full mx-auto" />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
