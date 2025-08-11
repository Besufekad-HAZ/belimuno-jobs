'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, User as UserIcon, LogOut } from 'lucide-react';
import { getStoredUser, clearAuth, getRoleDashboardPath } from '@/lib/auth';
import { notificationsAPI } from '@/lib/api';
import type { User } from '@/lib/auth';

type Notification = {
  id: string;
  message: string;
  read: boolean;
  // Add other fields as needed based on your API response
};

const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
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
    window.addEventListener('authChanged', updateUser);
    window.addEventListener('storage', updateUser);
    return () => {
      window.removeEventListener('authChanged', updateUser);
      window.removeEventListener('storage', updateUser);
    };
  }, []);
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      const notif = response.data.notifications;
      setUnreadCount(notif.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    // Notify all tabs
    window.dispatchEvent(new Event('authChanged'));
    router.push('/login');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'area_manager':
        return 'Area Manager';
      case 'worker':
        return 'Worker';
      case 'client':
        return 'Client';
      default:
        return role;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 via-cyan-700 to-cyan-500 shadow-md border-b border-cyan-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="relative h-12 w-12 mix-blend-luminosity border border-cyan-200 rounded-full bg-amber-50">
                <Image
                  src="/belimuno.png"
                  alt="Belimuno Logo"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
                Belimuno Jobs
              </h1>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6">
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
                href="/jobs"
                className="text-white hover:text-gray-200 font-medium transform hover:scale-105 transition duration-150 ease-in-out"
              >
                Jobs
              </Link>
            </nav>
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-cyan-100 hover:text-white">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-cyan-100 hover:text-white"
                >
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden md:block font-semibold">{user.name}</span>
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
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-cyan-100 hover:text-white px-3 py-2 text-sm font-medium border border-cyan-300 rounded-md"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-cyan-600 to-blue-900 hover:from-cyan-700 hover:to-blue-950 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-md border border-cyan-300"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
