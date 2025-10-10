import Cookies from "js-cookie";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin_hr" | "admin_outsource" | "worker" | "client";
  isVerified?: boolean;
  isActive?: boolean;
  // Region can be populated (object) or just an id string depending on auth response
  region?:
    | {
        _id: string;
        name?: string;
        code?: string;
      }
    | string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    skills?: string[];
    experience?: number | string;
    location?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      region?: string;
      country?: string;
    };
    region?: string;
    hourlyRate?: number;
    availability?: string;
    portfolio?: string[] | string;
    verified?: boolean;
    rating?: number;
    completedJobs?: number;
    totalEarnings?: number;
    company?: string;
    industry?: string;
    website?: string;
    managedRegion?: string;
    permissions?: string[];
    dob?: string;
    gender?: string;
    isVerified?: boolean;
    isActive?: boolean;
    avatar?: string;
    cv?: {
      name?: string;
      mimeType?: string;
      data?: string;
    };
  };
  workerProfile?: {
    education?: Array<{
      school?: string;
      degree?: string;
      field?: string;
      startDate?: string;
      endDate?: string | null;
      description?: string;
      gpa?: string;
    }>;
    workHistory?: Array<{
      company?: string;
      title?: string;
      startDate?: string;
      endDate?: string | null;
      description?: string;
    }>;
    skills?: string[];
    languages?: string[];
    certifications?: string[];
    portfolio?: string[];
    rating?: number;
    totalJobs?: number;
    completedJobs?: number;
    availability?: string;
    hourlyRate?: number;
    experience?: string | number;
    verifiedAt?: string;
  };
  clientProfile?: {
    company?: string;
    companyName?: string;
    industry?: string;
    companySize?: string;
    website?: string;
    totalProjects?: number;
    projectsCompleted?: number;
    totalSpent?: number;
    lastProjectDate?: string;
    score?: number;
    phone?: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;

  const userStr = Cookies.get("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return Cookies.get("token") || null;
};

export const setAuth = (token: string, user: User) => {
  Cookies.set("token", token, { expires: 30 });

  // Store only essential user data to avoid cookie size limits
  const essentialUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
  };

  try {
    Cookies.set("user", JSON.stringify(essentialUser), { expires: 30 });
  } catch (error) {
    console.error("Failed to store user in cookies:", error);
    // Fallback: try with even smaller object
    Cookies.set(
      "user",
      JSON.stringify({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }),
      { expires: 30 },
    );
  }
};

export const clearAuth = () => {
  Cookies.remove("token");
  Cookies.remove("user");
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
    case "super_admin":
      return "/admin/dashboard";
    case "admin_hr":
      return "/admin/hr/dashboard";
    case "admin_outsource":
      return "/admin/outsource/dashboard";
    case "worker":
      return "/worker/dashboard";
    case "client":
      return "/client/dashboard";
    default:
      return "/login";
  }
};
