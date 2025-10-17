import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { User } from "@/lib/auth"; // Import User interface

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  data: T;
}

// Resolve API base URL: prefer env, otherwise try localhost ports (helpful in dev when server auto-binds next free port)
const envBase =
  typeof process !== "undefined"
    ? (process as unknown as { env?: { NEXT_PUBLIC_API_BASE_URL?: string } })
        .env?.NEXT_PUBLIC_API_BASE_URL
    : undefined;
const DEFAULT_BASES = [
  "http://localhost:5000/api",
  // "https://belimuno-jobs.onrender.com/api",
  // "http://localhost:5000/api",
  // "http://localhost:5002/api",
  // "http://localhost:5003/api",
  // "http://localhost:5004/api",
  // "http://localhost:5005/api",
];
const BASES = envBase ? [envBase] : DEFAULT_BASES;
let currentBaseIndex = 0;

const api = axios.create({
  baseURL: BASES[currentBaseIndex],
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, clear auth and redirect
    if (error.response?.status === 401) {
      const url = (error.config && error.config.url) || "";
      // Do NOT auto-redirect on auth endpoints so forms can show field-level errors
      const isAuthEndpoint =
        typeof url === "string" &&
        (url.includes("/auth/login") ||
          url.includes("/auth/register") ||
          url.includes("/auth/forgot-password") ||
          url.includes("/auth/google"));
      const onLoginPage =
        typeof window !== "undefined" &&
        window.location &&
        window.location.pathname === "/login";
      if (!isAuthEndpoint && !onLoginPage) {
        Cookies.remove("token");
        Cookies.remove("user");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    // If network error (no response), try next fallback base URL (dev convenience)
    if (
      !error.response &&
      BASES.length > 1 &&
      currentBaseIndex < BASES.length - 1
    ) {
      currentBaseIndex += 1;
      const nextBase = BASES[currentBaseIndex];
      api.defaults.baseURL = nextBase;
      const originalRequest = error.config;
      // retry original request with new base
      return api({ ...originalRequest, baseURL: nextBase });
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (userData: Record<string, unknown>) =>
    api.post("/auth/register", userData),
  loginWithGoogle: (credential: string, role?: "worker" | "client") =>
    api.post("/auth/google", role ? { credential, role } : { credential }),
  getMe: () => api.get<ApiResponse<{ user: User }>>("/auth/me"),
  logout: () => api.post<ApiResponse<null>>("/auth/logout"),
  updateProfile: (profileData: {
    name?: string;
    phone?: string;
    notifications?: Record<string, boolean>;
    region?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
      bio?: string;
      dob?: string | Date;
      cv?: { name?: string; mimeType?: string; data?: string | object } | null;
      address?: {
        street?: string;
        city?: string;
        region?: string;
        country?: string;
      };
      skills?: string[];
      experience?: string;
      hourlyRate?: number;
    };
    workerProfile?: {
      education?: Array<{
        school?: string;
        degree?: string;
        field?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
      }>;
      workHistory?: Array<{
        company?: string;
        title?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
      }>;
      availability?: string;
      portfolio?: string[];
      certifications?: string[];
      languages?: string[];
    };
    clientProfile?: {
      companyName?: string;
      industry?: string;
      website?: string;
    };
  }) => api.put<ApiResponse<{ user: User }>>("/auth/profile", profileData),
  forgotPassword: (email: string) =>
    api.post<ApiResponse<null>>("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string, confirmPassword: string) =>
    api.post(`/auth/reset-password/${token}`, { password, confirmPassword }),
};

// Jobs API
export const jobsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get("/jobs", { params }),
  getById: (id: string) => api.get(`/jobs/${id}`),
  apply: (
    id: string,
    proposal: string,
    proposedBudget: number,
    extras?: { estimatedDuration?: string; coverLetter?: string },
  ) =>
    api.post(`/jobs/${id}/apply`, {
      proposal,
      proposedBudget,
      ...(extras || {}),
    }),
  getCategories: () => api.get("/jobs/categories"),
  search: (query: string, params?: Record<string, unknown>) =>
    api.get("/jobs/search", { params: { q: query, ...(params || {}) } }),
  getStats: () => api.get("/jobs/stats"),
};

// Client API
export const clientAPI = {
  getDashboard: () => api.get("/client/dashboard"),
  getJobs: () => api.get("/client/jobs"),
  createJob: (jobData: Record<string, unknown>) =>
    api.post("/client/jobs", jobData),
  getJob: (id: string) => api.get(`/client/jobs/${id}`),
  updateJob: (id: string, jobData: Record<string, unknown>) =>
    api.put(`/client/jobs/${id}`, jobData),
  deleteJob: (id: string) => api.delete(`/client/jobs/${id}`),
  updateJobStatus: (id: string, status: string, progress?: number) =>
    api.put(`/client/jobs/${id}/status`, {
      status,
      progressPercentage: progress,
    }),
  acceptApplication: (jobId: string, applicationId: string) =>
    api.put(`/client/jobs/${jobId}/applications/${applicationId}/accept`),
  rejectApplication: (jobId: string, applicationId: string) =>
    api.put(`/client/jobs/${jobId}/applications/${applicationId}/reject`),
  completeJob: (id: string) => api.put(`/client/jobs/${id}/complete`),
  completeJobWithRating: (id: string, rating: number, review: string) =>
    api.put(`/client/jobs/${id}/complete`, { rating, review }),
  requestRevision: (id: string, reason: string) =>
    api.put(`/client/jobs/${id}/request-revision`, { reason }),
  getPayments: () => api.get("/client/payments"),
  uploadPaymentProof: (
    paymentId: string,
    payload: {
      imageData: string;
      filename?: string;
      mimeType?: string;
      note?: string;
    },
  ) => api.put(`/client/payments/${paymentId}/proof`, payload),
  getJobMessages: (jobId: string) => api.get(`/client/jobs/${jobId}/messages`),
  sendJobMessage: (
    jobId: string,
    content: string,
    attachments?: string[],
    config?: AxiosRequestConfig,
  ) =>
    api.post(
      `/client/jobs/${jobId}/messages`,
      { content, attachments },
      config,
    ),

  // Disputes
  createDispute: (payload: {
    title: string;
    description: string;
    type:
      | "payment"
      | "quality"
      | "communication"
      | "deadline"
      | "scope"
      | "other";
    priority: "low" | "medium" | "high" | "urgent";
    job: string;
    evidence?: Array<{
      type: "image" | "document" | "message";
      url: string;
      description?: string;
    }>;
  }) => api.post("/client/disputes", payload),

  getDisputes: (params?: {
    status?: "open" | "investigating" | "resolved" | "closed";
    page?: number;
    limit?: number;
  }) => api.get("/client/disputes", { params }),

  getDispute: (id: string) => api.get(`/client/disputes/${id}`),

  updateDispute: (
    id: string,
    payload: {
      description?: string;
      evidence?: Array<{
        type: "image" | "document" | "message";
        url: string;
        description?: string;
      }>;
    },
  ) => api.put(`/client/disputes/${id}`, payload),
};

// Worker API
export const workerAPI = {
  getDashboard: () => api.get("/worker/dashboard"),
  getJobs: () => api.get("/worker/jobs"),
  getJob: (id: string) => api.get(`/worker/jobs/${id}`),
  updateJobStatus: (id: string, status: string, progress?: number) =>
    api.put(`/worker/jobs/${id}/status`, {
      status,
      progressPercentage: progress,
    }),
  getApplications: () => api.get("/worker/applications"),
  withdrawApplication: (id: string) => api.delete(`/worker/applications/${id}`),
  updateProfile: (profileData: {
    name?: string;
    phone?: string;
    notifications?: Record<string, boolean>;
    region?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
      bio?: string;
      dob?: string | Date;
      cv?: { name?: string; mimeType?: string; data?: string | object } | null;
      address?: {
        street?: string;
        city?: string;
        region?: string;
        country?: string;
      };
      skills?: string[];
      experience?: string;
      hourlyRate?: number;
    };
    workerProfile?: {
      education?: Array<{
        school?: string;
        degree?: string;
        field?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
      }>;
      workHistory?: Array<{
        company?: string;
        title?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
      }>;
      availability?: string;
      portfolio?: string[];
      certifications?: string[];
      languages?: string[];
    };
  }) => api.put<ApiResponse<{ user: User }>>("/worker/profile", profileData),
  getEarnings: () => api.get("/worker/earnings"),
  getJobMessages: (jobId: string) => api.get(`/worker/jobs/${jobId}/messages`),
  sendJobMessage: (
    jobId: string,
    content: string,
    attachments?: string[],
    config?: AxiosRequestConfig,
  ) =>
    api.post(
      `/worker/jobs/${jobId}/messages`,
      { content, attachments },
      config,
    ),
  reviewClient: (
    jobId: string,
    payload: { rating: number; comment?: string; title?: string },
  ) => api.post(`/worker/jobs/${jobId}/review`, payload),
  declineAssignedJob: (jobId: string) =>
    api.put(`/worker/jobs/${jobId}/decline`),
  acceptAssignedJob: (jobId: string) => api.put(`/worker/jobs/${jobId}/accept`),
  // Saved jobs
  getSavedJobs: () => api.get("/worker/saved-jobs"),
  saveJob: (jobId: string) => api.post(`/worker/saved-jobs/${jobId}`),
  unsaveJob: (jobId: string) => api.delete(`/worker/saved-jobs/${jobId}`),
  // Jobs for you based on worker skills/category
  getJobsForYou: (params?: Record<string, unknown>) =>
    api.get("/worker/jobs-for-you", { params }),
  // Disputes
  createDispute: (payload: {
    title: string;
    description: string;
    type:
      | "payment"
      | "quality"
      | "communication"
      | "deadline"
      | "scope"
      | "other";
    priority: "low" | "medium" | "high" | "urgent";
    job: string;
    evidence?: Array<{
      type: "image" | "document" | "message";
      url: string;
      description?: string;
    }>;
  }) => api.post("/worker/disputes", payload),

  getDisputes: (params?: {
    status?: "open" | "investigating" | "resolved" | "closed";
    page?: number;
    limit?: number;
  }) => api.get("/worker/disputes", { params }),

  getDispute: (id: string) => api.get(`/worker/disputes/${id}`),

  updateDispute: (
    id: string,
    payload: {
      description?: string;
      evidence?: Array<{
        type: "image" | "document" | "message";
        url: string;
        description?: string;
      }>;
    },
  ) => api.put(`/worker/disputes/${id}`, payload),
};

// Admin API
export const adminAPI = {
  getDashboard: (params?: Record<string, unknown>) =>
    api.get("/admin/dashboard", { params }),
  getUsers: (params?: {
    role?: "worker" | "client";
    status?: "active" | "inactive" | "banned";
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    select?: string;
  }) => api.get("/admin/users", { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (
    id: string,
    userData: {
      name?: string;
      email?: string;
      role?:
        | "worker"
        | "client"
        | "admin"
        | "super_admin"
        | "admin_hr"
        | "admin_outsource"
        | string;
      status?: "active" | "inactive" | "banned";
      verified?: boolean;
      isActive?: boolean;
      isVerified?: boolean;
      phone?: string;
      region?: string;
      notifications?: Record<string, boolean>;
    },
  ) => api.put(`/admin/users/${id}`, userData),
  verifyWorker: (id: string) => api.put(`/admin/verify-worker/${id}`),
  deactivateUser: (id: string, reason?: string) =>
    api.put(`/admin/users/${id}/deactivate`, { reason }),
  activateUser: (id: string) => api.put(`/admin/users/${id}/activate`),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getJobs: (params?: {
    status?: "draft" | "open" | "in_progress" | "completed" | "cancelled";
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    select?: string;
  }) => api.get("/admin/jobs", { params }),
  createJob: (jobData: {
    title?: string;
    description?: string;
    category?: string;
    budget?: { min: number; max: number } | number;
    status?:
      | "draft"
      | "open"
      | "posted"
      | "in_progress"
      | "completed"
      | "cancelled"
      | string;
    featured?: boolean;
    deadline?: string;
    location?: string;
    tags?: string[];
  }) => api.post("/admin/jobs", jobData),
  getAllJobs: (params?: {
    status?: "draft" | "open" | "in_progress" | "completed" | "cancelled";
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    select?: string;
  }) => api.get("/admin/jobs", { params }),
  getJob: (id: string) => api.get(`/admin/jobs/${id}`),
  updateJob: (
    id: string,
    jobData: {
      title?: string;
      description?: string;
      category?: string;
      budget?: { min: number; max: number } | number;
      status?:
        | "draft"
        | "open"
        | "posted"
        | "in_progress"
        | "completed"
        | "cancelled"
        | string;
      featured?: boolean;
      deadline?: string;
      location?: string;
      tags?: string[];
    },
  ) => api.put(`/admin/jobs/${id}`, jobData),
  deleteJob: (id: string) => api.delete(`/admin/jobs/${id}`),
  getPerformance: () => api.get("/admin/performance"),
  getPayments: (params?: {
    status?: "pending" | "processing" | "completed" | "failed" | "disputed";
    method?: string;
    page?: number;
    limit?: number;
    sort?: string;
    select?: string;
  }) => api.get("/admin/payments", { params }),
  getPayment: (id: string) => api.get(`/admin/payments/${id}`),
  updatePayment: (
    id: string,
    payload: {
      status?: "pending" | "processing" | "completed" | "failed";
      notes?: string;
    },
  ) => api.put(`/admin/payments/${id}`, payload),
  handlePaymentDispute: (
    paymentId: string,
    action: "refund" | "release" | "partial",
    resolution: string,
  ) =>
    api.put(`/admin/payments/${paymentId}/dispute`, {
      action,
      resolution,
    }),
  markPaymentPaid: (paymentId: string) =>
    api.put(`/admin/payments/${paymentId}/mark-paid`),
  // Reviews moderation
  getReviews: (params?: {
    status?: "draft" | "published" | "hidden" | string;
    moderationStatus?: "pending" | "approved" | "rejected" | string;
    reviewer?: string;
    reviewee?: string;
    page?: number;
    limit?: number;
  }) => api.get("/admin/reviews", { params }),
  moderateReview: (
    id: string,
    payload: {
      moderationStatus?: "pending" | "approved" | "rejected";
      status?: "draft" | "published" | "hidden" | string;
      isPublic?: boolean;
    },
  ) => api.put(`/admin/reviews/${id}`, payload),

  // Disputes management
  getDisputes: (params?: {
    status?: "open" | "investigating" | "resolved" | "closed";
    priority?: "low" | "medium" | "high" | "urgent";
    type?:
      | "payment"
      | "quality"
      | "communication"
      | "deadline"
      | "scope"
      | "other";
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get("/admin/disputes", { params }),
  getDispute: (id: string) => api.get(`/admin/disputes/${id}`),
  createDispute: (payload: {
    title: string;
    description: string;
    type:
      | "payment"
      | "quality"
      | "communication"
      | "deadline"
      | "scope"
      | "other";
    priority: "low" | "medium" | "high" | "urgent";
    worker: string;
    client: string;
    job?: string;
    evidence?: Array<{
      type: "image" | "document" | "message";
      url: string;
      description?: string;
    }>;
  }) => api.post("/admin/disputes", payload),
  updateDispute: (
    id: string,
    payload: {
      status?: "open" | "investigating" | "resolved" | "closed";
      priority?: "low" | "medium" | "high" | "urgent";
      assignedTo?: string;
      resolution?: string;
      notes?: string;
      hrNotes?: string;
    },
  ) => api.put(`/admin/disputes/${id}`, payload),

  // Application management
  shortlistApplication: (id: string, notes?: string) =>
    api.put(`/admin/applications/${id}/shortlist`, { notes }),
  unshortlistApplication: (id: string) =>
    api.put(`/admin/applications/${id}/unshortlist`),

  // Team management
  getTeamMembers: (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    status?: string;
  }) => api.get("/admin/team", { params }),
  createTeamMember: (payload: {
    name: string;
    role: string;
    department: string;
    photoUrl?: string;
    photoKey?: string | null;
    email?: string;
    phone?: string;
    bio?: string;
    order?: number;
  }) => api.post("/admin/team", payload),
  updateTeamMember: (
    id: string,
    payload: {
      name?: string;
      role?: string;
      department?: string;
      photoUrl?: string;
      photoKey?: string | null;
      email?: string;
      phone?: string;
      bio?: string;
      order?: number;
    },
  ) => api.put(`/admin/team/${id}`, payload),
  deleteTeamMember: (id: string) => api.delete(`/admin/team/${id}`),

  // photo upload routes
  uploadTeamPhoto: (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post("/admin/team/upload-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadNewsImage: (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post("/admin/news/upload-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadClientLogo: (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post("/admin/clients/upload-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // News management
  getNews: (params?: {
    status?: "draft" | "published" | "archived";
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => api.get("/admin/news", { params }),
  getNewsArticle: (id: string) => api.get(`/admin/news/${id}`),
  createNews: (payload: {
    title: string;
    excerpt: string;
    content?: string;
    date?: string;
    category: string;
    image?: string;
    readTime?: string;
    author?: string;
    status?: "draft" | "published" | "archived";
  }) => api.post("/admin/news", payload),
  updateNews: (
    id: string,
    payload: {
      title?: string;
      excerpt?: string;
      content?: string;
      date?: string;
      category?: string;
      image?: string;
      readTime?: string;
      author?: string;
      status?: "draft" | "published" | "archived";
    },
  ) => api.put(`/admin/news/${id}`, payload),
  deleteNews: (id: string) => api.delete(`/admin/news/${id}`),

  // Client management
  getClients: (params?: {
    status?: "active" | "inactive" | "archived";
    type?: string;
    service?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => api.get("/admin/clients", { params }),
  getClient: (id: string) => api.get(`/admin/clients/${id}`),
  createClient: (payload: {
    name: string;
    type: string;
    service?: string;
    logo?: string;
    status?: "active" | "inactive" | "archived";
  }) => api.post("/admin/clients", payload),
  updateClient: (
    id: string,
    payload: {
      name?: string;
      type?: string;
      service?: string;
      logo?: string;
      status?: "active" | "inactive" | "archived";
    },
  ) => api.put(`/admin/clients/${id}`, payload),
  deleteClient: (id: string) => api.delete(`/admin/clients/${id}`),

  // Additional endpoints from second adminAPI
  getStats: () => api.get("/admin/stats"),
  getAnalytics: (params?: {
    period?: "day" | "week" | "month" | "year";
    startDate?: string;
    endDate?: string;
  }) => api.get("/admin/analytics", { params }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }) => api.get("/notifications", { params }),
  getAll: (params?: { page?: number; limit?: number; isRead?: boolean }) =>
    api.get("/notifications", { params }),
  getStats: () => api.get("/notifications/stats"),
  markAsRead: (id: string) =>
    api.put<ApiResponse<null>>(`/notifications/${id}/read`),
  markAllAsRead: () => api.put<ApiResponse<null>>("/notifications/read-all"),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  create: (payload: {
    recipients: string[];
    title: string;
    message: string;
    type?: string;
    priority?: "low" | "medium" | "high" | "urgent" | string;
    relatedJob?: string;
    relatedUser?: string;
    relatedPayment?: string;
    actionButton?: {
      text: string;
      url: string;
      action?: string;
    };
    channels?: {
      inApp?: boolean;
      email?: boolean;
      sms?: boolean;
    };
    expiresAt?: string;
  }) => api.post("/notifications/create", payload),
  sendAnnouncement: (payload: {
    title: string;
    message: string;
    targetRoles?: string[] | string;
    priority?: "low" | "medium" | "high" | "urgent" | string;
    expiresAt?: string;
  }) => api.post("/notifications/announcement", payload),
};

// Chat API for admin collaboration
export const chatAPI = {
  getContacts: () => api.get("/chat/contacts"),
  getConversations: () => api.get("/chat/conversations"),
  createConversation: (participantIds: string[], title?: string) =>
    api.post("/chat/conversations", {
      participantIds,
      title,
    }),
  getMessages: (
    conversationId: string,
    params?: { limit?: number; before?: string },
  ) => api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (
    conversationId: string,
    payload: {
      content?: string;
      attachments?: Array<{
        name: string;
        type?: string;
        url: string;
        size?: number;
      }>;
    },
    config?: AxiosRequestConfig,
  ) =>
    api.post(`/chat/conversations/${conversationId}/messages`, payload, config),
};

// Contact API
export const contactAPI = {
  sendMessage: (messageData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => api.post("/contact", messageData),
  submit: (messageData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => api.post("/contact", messageData),
};

// Public API
export const publicAPI = {
  getNews: (params?: {
    status?: "draft" | "published" | "archived";
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => api.get("/news", { params }),
  getNewsArticle: (id: string) => api.get(`/news/${id}`),
  getClients: (params?: {
    status?: "active" | "inactive" | "archived";
    type?: string;
    service?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => api.get("/clients", { params }),
};

export default api;
