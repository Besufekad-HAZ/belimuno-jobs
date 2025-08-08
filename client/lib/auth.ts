import Cookies from 'js-cookie';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'area_manager' | 'worker' | 'client';
  // Region can be populated (object) or just an id string depending on auth response
  region?: {
    _id: string;
    name?: string;
    code?: string;
  } | string;
  profile?: {
    bio?: string;
    skills?: string[];
    experience?: number;
    location?: string;
    phone?: string;
    region?: string;
    hourlyRate?: number;
    availability?: string;
    portfolio?: string[];
    verified?: boolean;
    rating?: number;
    completedJobs?: number;
    totalEarnings?: number;
    company?: string;
    industry?: string;
    website?: string;
    managedRegion?: string;
    permissions?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  const userStr = Cookies.get('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return Cookies.get('token') || null;
};

export const setAuth = (token: string, user: User) => {
  Cookies.set('token', token, { expires: 30 });
  Cookies.set('user', JSON.stringify(user), { expires: 30 });
};

export const clearAuth = () => {
  Cookies.remove('token');
  Cookies.remove('user');
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

export const hasRole = (user: User | null, roles: string[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

export const getRoleDashboardPath = (role: string): string => {
  switch (role) {
    case 'super_admin':
      return '/admin/dashboard';
    case 'area_manager':
      return '/area-manager/dashboard';
    case 'worker':
      return '/worker/dashboard';
    case 'client':
      return '/client/dashboard';
    default:
      return '/login';
  }
};
