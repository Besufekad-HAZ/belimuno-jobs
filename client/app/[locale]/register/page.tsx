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

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "worker",
    // Client-specific fields
    company: "",
    industry: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("RegisterPage");

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: "" };

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
      {
        0: "Very Weak",
        1: "Weak",
        2: "Fair",
        3: "Good",
        4: "Strong",
        5: "Very Strong",
      }[score] || "";

    return { score, text: strengthText, checks };
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

      case "company":
        if (formData.role === "client" && (!value || value.trim().length < 2)) {
          errors.push("Company name must be at least 2 characters long");
        }
        break;

      case "industry":
        if (formData.role === "client" && (!value || value.trim().length < 2)) {
          errors.push("Industry must be at least 2 characters long");
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

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate field in real-time (with debounce for better UX)
    if (name === "password" || name === "confirmPassword" || name === "email") {
      setTimeout(() => {
        const errors = validateField(name, value);
        if (errors.length > 0) {
          setFieldErrors((prev) => ({ ...prev, [name]: errors[0] }));
        } else {
          // Clear error when field becomes valid
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

    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    if (formData.name && formData.name.trim().length > 50) {
      errors.push("Name must be no more than 50 characters long");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.push("Please provide a valid email address");
    }

    // Password validation
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

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    // Role validation
    const validRoles = [
      "super_admin",
      "admin_hr",
      "admin_outsource",
      "client",
      "worker",
    ];
    if (!formData.role || !validRoles.includes(formData.role)) {
      errors.push("Please select a valid role");
    }

    // Client-specific validation
    if (formData.role === "client") {
      if (!formData.company || formData.company.trim().length < 2) {
        errors.push("Company name must be at least 2 characters long");
      }
      if (!formData.industry || formData.industry.trim().length < 2) {
        errors.push("Industry must be at least 2 characters long");
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      setLoading(false);
      return;
    }

    try {
      // Prepare registration data based on role
      interface RegistrationProfile {
        bio?: string;
        address?: {
          city?: string;
          country?: string;
        };
      }

      interface RegistrationData {
        name: string;
        email: string;
        password: string;
        role: string;
        profile?: RegistrationProfile;
        clientProfile?: {
          companyName: string;
          industry: string;
          website: string;
        };
      }

      const registrationData: RegistrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {},
      };

      // Add role-specific fields
      if (formData.role === "client") {
        registrationData.clientProfile = {
          companyName: formData.company,
          industry: formData.industry,
          website: formData.website,
        };
      }

      const response = await authAPI.register(
        registrationData as unknown as Record<string, unknown>,
      );
      const { token, user } = response.data;

      setAuth(token, user);
      // Notify all tabs and components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("authChanged"));
      }
      
      // Redirect workers to CV builder, others to dashboard
      if (user.role === "worker") {
        router.push("/profile/cv-builder");
      } else {
        router.push(getRoleDashboardPath(user.role));
      }
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
            .message,
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
            formData.role as "worker" | "client",
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
  }, [googleReady, formData.role, router, t]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top tabs + title section remains narrow for focus */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
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

      {/* Main form card: widen and use responsive grid on md+/xl */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-6xl">
        <Card>
          <form
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded md:col-span-2 xl:col-span-3">
                {error}
              </div>
            )}

            <div className="md:col-span-1">
              <Input
                label={t("form.fields.name")}
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={fieldErrors.name ? "border-red-500" : ""}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div className="md:col-span-1">
              <Input
                label={t("form.fields.email")}
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={fieldErrors.email ? "border-red-500" : ""}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div className="md:col-span-1">
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

            {/* Client-specific fields */}
            {formData.role === "client" && (
              <>
                <div className="md:col-span-1">
                  <Input
                    label={t("form.fields.company")}
                    name="company"
                    type="text"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className={fieldErrors.company ? "border-red-500" : ""}
                  />
                  {fieldErrors.company && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.company}</p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <Input
                    label={t("form.fields.industry")}
                    name="industry"
                    type="text"
                    required
                    value={formData.industry}
                    onChange={handleChange}
                    className={fieldErrors.industry ? "border-red-500" : ""}
                  />
                  {fieldErrors.industry && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.industry}</p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <Input
                    label={t("form.fields.website")}
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    className={fieldErrors.website ? "border-red-500" : ""}
                  />
                  {fieldErrors.website && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.website}</p>
                  )}
                </div>
              </>
            )}

            {/* Google Sign Up Button */}
            <div className="flex justify-center md:col-span-2 xl:col-span-3">
              <div ref={googleBtnRef} />
            </div>

            <div className="md:col-span-1">
              <Input
                label={t("form.fields.password")}
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={fieldErrors.password ? "border-red-500" : ""}
                showPasswordToggle
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}

              {/* Password Strength Indicator */}
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
                                : "bg-gray-200"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        getPasswordStrength(formData.password).score <= 2
                          ? "text-red-600"
                          : getPasswordStrength(formData.password).score <= 3
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {getPasswordStrength(formData.password).text}
                    </span>
                  </div>

                  {/* Password Requirements */}
                  <div className="mt-2 text-xs text-gray-600">
                    <p className="font-medium">Password must contain:</p>
                    <ul className="mt-1 space-y-1">
                      <li
                        className={`flex items-center ${formData.password.length >= 8 ? "text-green-600" : "text-gray-500"}`}
                      >
                        <span className="mr-2">
                          {formData.password.length >= 8 ? "✓" : "○"}
                        </span>
                        At least 8 characters
                      </li>
                      <li
                        className={`flex items-center ${/[a-z]/.test(formData.password) ? "text-green-600" : "text-gray-500"}`}
                      >
                        <span className="mr-2">
                          {/[a-z]/.test(formData.password) ? "✓" : "○"}
                        </span>
                        One lowercase letter
                      </li>
                      <li
                        className={`flex items-center ${/[A-Z]/.test(formData.password) ? "text-green-600" : "text-gray-500"}`}
                      >
                        <span className="mr-2">
                          {/[A-Z]/.test(formData.password) ? "✓" : "○"}
                        </span>
                        One uppercase letter
                      </li>
                      <li
                        className={`flex items-center ${/\d/.test(formData.password) ? "text-green-600" : "text-gray-500"}`}
                      >
                        <span className="mr-2">
                          {/\d/.test(formData.password) ? "✓" : "○"}
                        </span>
                        One number
                      </li>
                      <li
                        className={`flex items-center ${/[@$!%*?&]/.test(formData.password) ? "text-green-600" : "text-gray-500"}`}
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
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={fieldErrors.confirmPassword ? "border-red-500" : ""}
                showPasswordToggle
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <Button type="submit" className="w-full" loading={loading}>
                {loading
                  ? t("form.buttons.submit.loading")
                  : t("form.buttons.submit.default")}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
