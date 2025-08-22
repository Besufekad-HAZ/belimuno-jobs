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

const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Listen for login/logout events across tabs and on auth changes
  useEffect(() => {
    const updateUser = () => {
      const currentUser = getStoredUser();
      setUser(currentUser);
      if (currentUser) {
        fetchNotifications();
      }
    };
    updateUser();
    window.addEventListener("authChanged", updateUser);
    window.addEventListener("storage", updateUser);
    return () => {
      window.removeEventListener("authChanged", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, []);
  // Close user menu when clicking outside
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      const notif =
        response.data?.data ||
        response.data?.notifications ||
        ([] as unknown[]);
      const count = Array.isArray(notif)
        ? notif.filter((n: unknown) => {
            const x = n as { isRead?: boolean; read?: boolean };
            return !x?.isRead && !x?.read;
          }).length
        : 0;
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    // Notify all tabs
    window.dispatchEvent(new Event("authChanged"));
    router.push("/login");
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin_hr":
        return "Admin - HR";
      case "admin_outsource":
        return "Admin - Outsource";
      case "worker":
        return "Worker";
      case "client":
        return "Client";
      default:
        return role;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 via-cyan-700 to-cyan-500 shadow-md border-b border-cyan-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 mix-blend-luminosity border border-cyan-200 rounded-full bg-amber-50">
                <Image
                  src="/belimuno.png"
                  alt="Belimuno Logo"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
                Belimuno Jobs
              </h1>
            </Link>

            {/* Navigation Links (desktop) */}
            <nav className="hidden lg:flex space-x-6">
              <Link
                href="/"
                className="text-white hover:text-gray-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-white hover:text-gray-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
              >
                About
              </Link>
              <Link
                href="/services"
                className="text-white hover:text-gray-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
              >
                Services
              </Link>
              <Link
                href="/clients"
                className="text-white hover:text-gray-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
              >
                Our Clients
              </Link>
              <Link
                href="/jobs"
                className="text-white hover:text-gray-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
              >
                Jobs
              </Link>
              <Link
                href="/contact"
                className="text-white hover:text-gray-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
              >
                Contact
              </Link>
            </nav>
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              {/* Mobile menu toggle */}
              <button
                className="hidden max-[900px]:inline-flex p-2 text-cyan-100 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="h-7 w-7" />
                ) : (
                  <Menu className="h-7 w-7" />
                )}
              </button>
              {/* Notifications */}
              <NotificationDropdown
                unreadCount={unreadCount}
                onNotificationUpdate={fetchNotifications}
              />

              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-cyan-100 hover:text-white"
                >
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden md:block font-semibold">
                    {user.name}
                  </span>
                  <span className="hidden md:block text-xs text-cyan-200">
                    ({getRoleDisplayName(user.role)})
                  </span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 z-50 border border-cyan-200 transition ease-out duration-200">
                    <Link
                      href={getRoleDashboardPath(user.role)}
                      className="block px-4 py-2 text-sm text-cyan-900 hover:bg-cyan-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-cyan-900 hover:bg-cyan-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-cyan-900 hover:bg-cyan-50"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
              <LanguageSelector />
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              {/* Mobile menu toggle */}
              <button
                className="hidden max-[900px]:inline-flex p-2 text-cyan-100 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="h-7 w-7" />
                ) : (
                  <Menu className="h-7 w-7" />
                )}
              </button>
              <div className="flex items-center gap-2 rounded-lg p-1 bg-cyan-800/40 border border-cyan-300/60">
                <Link href="/login" className="relative">
                  <span
                    className={`px-3 py-2 text-sm font-semibold rounded-md transition-all ${
                      pathname === "/login"
                        ? "bg-white text-cyan-900 shadow-sm"
                        : "text-cyan-100 hover:text-white"
                    }`}
                  >
                    Login
                  </span>
                </Link>
                <Link href="/register" className="relative">
                  <span
                    className={`px-3 py-2 text-sm font-semibold rounded-md transition-all ${
                      pathname === "/register"
                        ? "bg-white text-cyan-900 shadow-sm"
                        : "text-cyan-100 hover:text-white"
                    }`}
                  >
                    Sign up
                  </span>
                </Link>
              </div>
              <LanguageSelector />
            </div>
          )}
        </div>
      </div>
      {/* Mobile menu (<= 900px) */}
      {mobileOpen && (
        <div className="hidden max-[900px]:block border-t border-cyan-300/40 bg-gradient-to-b from-cyan-700 to-cyan-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block text-white px-3 py-2 rounded hover:bg-cyan-500/30"
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="block text-white px-3 py-2 rounded hover:bg-cyan-500/30"
            >
              About
            </Link>
            <Link
              href="/services"
              onClick={() => setMobileOpen(false)}
              className="block text-white px-3 py-2 rounded hover:bg-cyan-500/30"
            >
              Services
            </Link>
            <Link
              href="/clients"
              onClick={() => setMobileOpen(false)}
              className="block text-white px-3 py-2 rounded hover:bg-cyan-500/30"
            >
              Our Clients
            </Link>
            <Link
              href="/jobs"
              onClick={() => setMobileOpen(false)}
              className="block text-white px-3 py-2 rounded hover:bg-cyan-500/30"
            >
              Jobs
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block text-white px-3 py-2 rounded hover:bg-cyan-500/30"
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
