"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User as UserIcon, LogOut, Menu, X } from "lucide-react";
import { getStoredUser, clearAuth, getRoleDashboardPath } from "@/lib/auth";
import { notificationsAPI } from "@/lib/api";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import type { User } from "@/lib/auth";
import LanguageSelector from "../clients/LanguageSelector";
import { useTranslations } from "next-intl";

const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Navbar");

  // Sync user and notifications
  useEffect(() => {
    const updateUser = () => {
      const currentUser = getStoredUser();
      setUser(currentUser);
      if (currentUser) fetchNotifications();
    };
    updateUser();
    window.addEventListener("authChanged", updateUser);
    window.addEventListener("storage", updateUser);
    return () => {
      window.removeEventListener("authChanged", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, []);

  // Reset menu state when user changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [user]);

  // Ensure menu is closed on component mount
  useEffect(() => {
    setIsMenuOpen(false);
  }, []);

  // Close mobile on route change
  useEffect(() => {
    setMobileOpen(false);
    setIsMenuOpen(false); // Also close user menu on route change
  }, [pathname]);

  // Lock scroll when mobile menu is open and close via ESC
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const fetchNotifications = async () => {
    try {
      type NotificationItem = { isRead?: boolean; read?: boolean };
      const response = await notificationsAPI.getNotifications();
      const notif = ((response?.data as { notifications?: NotificationItem[] })
        ?.notifications ?? []) as NotificationItem[];
      const count = Array.isArray(notif)
        ? notif.filter((n: NotificationItem) => !n?.isRead && !n?.read).length
        : 0;
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    window.dispatchEvent(new Event("authChanged"));
    router.push("/login");
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return t("roles.super_admin");
      case "admin_hr":
        return t("roles.admin_hr");
      case "admin_outsource":
        return t("roles.admin_outsource");
      case "worker":
        return t("roles.worker");
      case "client":
        return t("roles.client");
      default:
        return role;
    }
  };

  const isAdminRoute = pathname?.startsWith("/admin");
  const isAdminUser =
    user && ["super_admin", "admin_hr", "admin_outsource"].includes(user.role);

  return (
    <nav className="sticky top-0 z-50 bg-gradient-primary shadow-md border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 mix-blend-luminosity border border-cyan-200 rounded-full bg-amber-50">
                <Image
                  src="/belimuno-logo.png"
                  alt="Belimuno Logo"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
                {t("brand")}
              </h1>
            </Link>

            {/* Desktop navigation */}
            {isAdminRoute || isAdminUser ? (
              <nav className="hidden lg:flex space-x-6" aria-label="Admin">
                <Link
                  href="/admin/dashboard"
                  className="text-white hover:text-blue-200 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="text-white hover:text-blue-200 font-medium"
                >
                  Users
                </Link>
                <Link
                  href="/admin/jobs"
                  className="text-white hover:text-blue-200 font-medium"
                >
                  Jobs
                </Link>
                <Link
                  href="/admin/payments"
                  className="text-white hover:text-blue-200 font-medium"
                >
                  Payments
                </Link>
                <Link
                  href="/admin/reviews"
                  className="text-white hover:text-blue-200 font-medium"
                >
                  Reviews
                </Link>
              </nav>
            ) : (
              <nav className="hidden lg:flex space-x-6" aria-label="Primary">
                <Link
                  href="/"
                  className="text-white hover:text-blue-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
                  aria-current={pathname === "/" ? "page" : undefined}
                >
                  {t("navigation.home")}
                </Link>
                <Link
                  href="/about"
                  className="text-white hover:text-blue-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
                  aria-current={pathname === "/about" ? "page" : undefined}
                >
                  {t("navigation.about")}
                </Link>
                <Link
                  href="/services"
                  className="text-white hover:text-blue-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
                >
                  {t("navigation.services")}
                </Link>
                <Link
                  href="/clients"
                  className="text-white hover:text-blue-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
                >
                  {t("navigation.clients")}
                </Link>
                <Link
                  href="/jobs"
                  className="text-white hover:text-blue-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
                >
                  {t("navigation.jobs")}
                </Link>
                <Link
                  href="/contact"
                  className="text-white hover:text-blue-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
                >
                  {t("navigation.contact")}
                </Link>
              </nav>
            )}
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              {/* Mobile menu toggle */}
              <button
                className="hidden max-[900px]:inline-flex p-2 text-blue-100 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                {mobileOpen ? (
                  <X className="h-7 w-7" />
                ) : (
                  <Menu className="h-7 w-7" />
                )}
              </button>

              {/* Notifications - hide on very small screens to avoid clashes */}
              <div className="hidden sm:block">
                <NotificationDropdown
                  unreadCount={unreadCount}
                  onNotificationUpdate={fetchNotifications}
                />
              </div>

              {/* User Menu - hide name/role on small screens */}
              <div className="relative hidden sm:block" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="flex items-center space-x-2 p-2 text-blue-100 hover:text-white"
                >
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden md:block font-semibold">
                    {user.name}
                  </span>
                  <span className="hidden md:block text-xs text-blue-200">
                    ({getRoleDisplayName(user.role)})
                  </span>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 z-50 border border-blue-200 transition ease-out duration-200">
                    <Link
                      href={getRoleDashboardPath(user.role)}
                      className="block px-4 py-2 text-sm text-blue-900 hover:bg-blue-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t("auth.dashboard")}
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-blue-900 hover:bg-blue-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t("auth.profile")}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-blue-900 hover:bg-blue-50"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      {t("auth.logout")}
                    </button>
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              {/* Mobile menu toggle */}
              <button
                className="hidden max-[900px]:inline-flex p-2 text-blue-100 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="h-7 w-7" />
                ) : (
                  <Menu className="h-7 w-7" />
                )}
              </button>
              {/* Hide auth buttons on small screens to avoid crowding */}
              <div className="hidden sm:flex items-center gap-2 rounded-lg p-1 bg-blue-800/40 border border-blue-300/60">
                <Link href="/login" className="relative">
                  <span
                    className={`px-3 py-2 text-sm font-semibold rounded-md transition-all ${pathname === "/login" ? "bg-white text-blue-900 shadow-sm" : "text-blue-100 hover:text-white"}`}
                  >
                    {t("auth.login")}
                  </span>
                </Link>
                <Link href="/register" className="relative">
                  <span
                    className={`px-3 py-2 text-sm font-semibold rounded-md transition-all ${pathname === "/register" ? "bg-white text-blue-900 shadow-sm" : "text-blue-100 hover:text-white"}`}
                  >
                    {t("auth.signup")}
                  </span>
                </Link>
              </div>
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu (<= 900px) */}
      {mobileOpen && (
        <div
          className="hidden max-[900px]:block"
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          {/* Sliding sheet below navbar */}
          <div className="fixed top-16 inset-x-0 z-50 border-t border-blue-300/40 bg-gradient-primary shadow-lg">
            <div
              className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-1"
              role="menu"
            >
              {/* Primary nav links */}
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block text-white px-3 py-2 rounded hover:bg-blue-500/30"
                role="menuitem"
              >
                {t("navigation.home")}
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="block text-white px-3 py-2 rounded hover:bg-blue-500/30"
              >
                {t("navigation.about")}
              </Link>
              <Link
                href="/services"
                onClick={() => setMobileOpen(false)}
                className="block text-white px-3 py-2 rounded hover:bg-blue-500/30"
              >
                {t("navigation.services")}
              </Link>
              <Link
                href="/clients"
                onClick={() => setMobileOpen(false)}
                className="block text-white px-3 py-2 rounded hover:bg-blue-500/30"
              >
                {t("navigation.clients")}
              </Link>
              <Link
                href="/jobs"
                onClick={() => setMobileOpen(false)}
                className="block text-white px-3 py-2 rounded hover:bg-blue-500/30"
              >
                {t("navigation.jobs")}
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="block text-white px-3 py-2 rounded hover:bg-blue-500/30"
              >
                {t("navigation.contact")}
              </Link>

              {/* Divider */}
              <div
                className="border-t border-white/20 my-3"
                aria-hidden="true"
              />

              {/* Secondary actions (moved from header on small screens) */}
              {user ? (
                <div className="space-y-1">
                  <Link
                    href={getRoleDashboardPath(user.role)}
                    onClick={() => setMobileOpen(false)}
                    className="block text-white px-3 py-2 rounded hover:bg-blue-500/30"
                  >
                    {t("auth.dashboard")}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block text-white px-3 py-2 rounded hover:bg-blue-500/30"
                  >
                    {t("auth.profile")}
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left text-white px-3 py-2 rounded hover:bg-cyan-500/30"
                  >
                    {t("auth.logout")}
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block text-white px-3 py-2 rounded hover:bg-blue-500/30"
                  >
                    {t("auth.login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block text-white px-3 py-2 rounded hover:bg-blue-500/30"
                  >
                    {t("auth.signup")}
                  </Link>
                </div>
              )}

              {/* Language selector (mobile) */}
              <div className="pt-2">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
