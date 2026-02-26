"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  UserCircle,
} from "lucide-react";
import { getStoredUser, clearAuth, getRoleDashboardPath } from "@/lib/auth";
import { notificationsAPI } from "@/lib/api";
import { resolveAssetUrl } from "@/lib/assets";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import type { User } from "@/lib/auth";
import LanguageSelector from "../clients/LanguageSelector";
import { useTranslations } from "next-intl";

const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Navbar");

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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [user]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

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

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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

  const brandLogoSrc =
    resolveAssetUrl("/belimuno-logo.png") ?? "/belimuno-logo.png";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname?.startsWith(href);
  };

  const publicLinks = [
    { href: "/", label: t("navigation.home") },
    { href: "/about", label: t("navigation.about") },
    { href: "/services", label: t("navigation.services") },
    { href: "/clients", label: t("navigation.clients") },
    { href: "/jobs", label: t("navigation.jobs") },
    { href: "/contact", label: t("navigation.contact") },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/jobs", label: "Jobs" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/reviews", label: "Reviews" },
  ];

  const navLinks = isAdminRoute || isAdminUser ? adminLinks : publicLinks;

  return (
    <>
      <nav
        className={`navbar-root sticky top-0 z-50 transition-all duration-500 ease-out ${
          scrolled
            ? "navbar-scrolled shadow-lg shadow-blue-900/10"
            : "navbar-top"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 lg:h-[68px] items-center">
            {/* Brand */}
            <div className="flex items-center gap-3 lg:gap-8">
              <Link href="/" className="flex-shrink-0 flex items-center gap-2.5 group">
                <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 ease-out group-hover:bg-white group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-sky-900/20 group-hover:border-white/40">
                  <Image
                    src={brandLogoSrc}
                    alt="Belimuno Logo"
                    fill
                    sizes="44px"
                    className="object-contain p-0.5"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-none">
                    {t("brand")}
                  </span>
                </div>
              </Link>

              {/* Desktop navigation */}
              <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(link.href)
                        ? "text-white bg-white/15"
                        : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}
                    aria-current={isActive(link.href) ? "page" : undefined}
                  >
                    {link.label}
                    {isActive(link.href) && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-sky-300" />
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile hamburger */}
              <button
                className="lg:hidden relative p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                <div className="relative w-6 h-6">
                  <span
                    className={`absolute left-0 block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${
                      mobileOpen ? "top-[11px] rotate-45" : "top-1"
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-[11px] block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${
                      mobileOpen ? "opacity-0 scale-x-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute left-0 block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${
                      mobileOpen ? "top-[11px] -rotate-45" : "top-[21px]"
                    }`}
                  />
                </div>
              </button>

              {user ? (
                <>
                  <div className="hidden sm:block">
                    <NotificationDropdown
                      unreadCount={unreadCount}
                      onNotificationUpdate={fetchNotifications}
                    />
                  </div>

                  <div className="relative hidden sm:block" ref={menuRef}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                        isMenuOpen
                          ? "bg-white/20 text-white"
                          : "text-blue-100 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-sm">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div className="hidden md:flex flex-col items-start">
                        <span className="text-sm font-semibold leading-tight text-white">
                          {user.name}
                        </span>
                        <span className="text-[11px] leading-tight text-blue-200/80">
                          {getRoleDisplayName(user.role)}
                        </span>
                      </div>
                      <ChevronDown
                        className={`hidden md:block h-4 w-4 text-blue-200/60 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Dropdown */}
                    <div
                      className={`absolute right-0 mt-2 w-56 origin-top-right transition-all duration-200 ${
                        isMenuOpen
                          ? "opacity-100 scale-100 translate-y-0"
                          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                      }`}
                    >
                      <div className="rounded-xl bg-white shadow-xl shadow-slate-900/10 border border-slate-200/80 overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {getRoleDisplayName(user.role)}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href={getRoleDashboardPath(user.role)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            {t("auth.dashboard")}
                          </Link>
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <UserCircle className="h-4 w-4" />
                            {t("auth.profile")}
                          </Link>
                        </div>
                        <div className="border-t border-slate-100">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            {t("auth.logout")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <LanguageSelector />
                  </div>
                </>
              ) : (
                <>
                  <div className="hidden sm:flex items-center gap-2">
                    <Link
                      href="/login"
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        pathname === "/login"
                          ? "bg-white text-blue-900 shadow-sm"
                          : "text-white hover:bg-white/15"
                      }`}
                    >
                      {t("auth.login")}
                    </Link>
                    <Link
                      href="/register"
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        pathname === "/register"
                          ? "bg-white text-blue-900 shadow-sm"
                          : "bg-white/15 text-white border border-white/20 hover:bg-white/25 hover:border-white/30"
                      }`}
                    >
                      {t("auth.signup")}
                    </Link>
                  </div>
                  <div className="hidden sm:block">
                    <LanguageSelector />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
          className={`absolute top-16 inset-x-0 transition-all duration-300 ease-out ${
            mobileOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-4 opacity-0"
          }`}
        >
          <div className="mx-3 mt-2 rounded-2xl bg-gradient-to-b from-[#1e3a8a] to-[#1a3278] shadow-2xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 space-y-1" role="menu">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-white/15 text-white"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                  role="menuitem"
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />
                  )}
                </Link>
              ))}

              <div className="my-2 border-t border-white/10" aria-hidden="true" />

              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-sm">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-blue-200/70">{getRoleDisplayName(user.role)}</p>
                    </div>
                  </div>
                  <Link
                    href={getRoleDashboardPath(user.role)}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t("auth.dashboard")}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <UserCircle className="h-4 w-4" />
                    {t("auth.profile")}
                  </Link>
                  <div className="my-1 border-t border-white/10" aria-hidden="true" />
                  <div className="px-4 py-2">
                    <NotificationDropdown
                      unreadCount={unreadCount}
                      onNotificationUpdate={fetchNotifications}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("auth.logout")}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-2 py-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-white font-semibold bg-white/10 hover:bg-white/15 border border-white/15 transition-colors"
                  >
                    {t("auth.login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-white font-semibold bg-sky-500 hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/25"
                  >
                    {t("auth.signup")}
                  </Link>
                </div>
              )}

              <div className="px-2 py-3">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .navbar-root {
          background: linear-gradient(135deg, #1e3a8a 0%, #2563ab 50%, #1e3a8a 100%);
          background-size: 200% 200%;
          animation: navbar-gradient 12s ease-in-out infinite;
        }

        .navbar-scrolled {
          background: rgba(30, 58, 138, 0.97);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
        }

        .navbar-top {
          background: linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(37, 99, 171, 0.92) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        @keyframes navbar-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .navbar-root { animation: none; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
