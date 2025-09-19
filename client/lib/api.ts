import axios from "axios";
import Cookies from "js-cookie";

// Resolve API base URL: prefer env, otherwise try localhost ports (helpful in dev when server auto-binds next free port)
const envBase =
  typeof process !== "undefined"
    ? (process as unknown as { env?: { NEXT_PUBLIC_API_BASE_URL?: string } })
        .env?.NEXT_PUBLIC_API_BASE_URL
    : undefined;
const DEFAULT_BASES = [
  "http://localhost:5000/api",
  // "https://belimuno-jobs.onrender.com/api",
  // "http://localhost:5001/api",
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
      const isAuthEndpoint = typeof url === "string" && (
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/forgot-password") ||
        url.includes("/auth/google")
      );
      const onLoginPage = typeof window !== "undefined" && window.location && window.location.pathname === "/login";
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
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  updateProfile: (profileData: Record<string, unknown>) =>
    api.put("/auth/profile", profileData),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
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
  sendJobMessage: (jobId: string, content: string, attachments?: string[]) =>
    api.post(`/client/jobs/${jobId}/messages`, { content, attachments }),

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
  updateProfile: (profileData: Record<string, unknown>) =>
    api.put("/worker/profile", profileData),
  getEarnings: () => api.get("/worker/earnings"),
  getJobMessages: (jobId: string) => api.get(`/worker/jobs/${jobId}/messages`),
  sendJobMessage: (jobId: string, content: string, attachments?: string[]) =>
    api.post(`/worker/jobs/${jobId}/messages`, { content, attachments }),
  declineAssignedJob: (jobId: string) =>
    api.put(`/worker/jobs/${jobId}/decline`),
  acceptAssignedJob: (jobId: string) => api.put(`/worker/jobs/${jobId}/accept`),
  // Saved jobs
  getSavedJobs: () => api.get("/worker/saved-jobs"),
  saveJob: (jobId: string) => api.post(`/worker/saved-jobs/${jobId}`),
  unsaveJob: (jobId: string) => api.delete(`/worker/saved-jobs/${jobId}`),
  // Reviews
  reviewClient: (
    jobId: string,
    payload: { rating: number; comment: string; title?: string },
  ) => api.post(`/worker/jobs/${jobId}/review`, payload),

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
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: (params?: Record<string, unknown>) =>
    api.get("/admin/users", { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, userData: Record<string, unknown>) =>
    api.put(`/admin/users/${id}`, userData),
  deactivateUser: (id: string, reason?: string) =>
    api.put(`/admin/users/${id}/deactivate`, { reason }),
  activateUser: (id: string) => api.put(`/admin/users/${id}/activate`),
  verifyWorker: (id: string) => api.put(`/admin/verify-worker/${id}`),
  getAllJobs: () => api.get("/admin/jobs"),
  createJob: (payload: Record<string, unknown>) =>
    api.post("/admin/jobs", payload),
  updateJob: (id: string, payload: Record<string, unknown>) =>
    api.put(`/admin/jobs/${id}`, payload),
  deleteJob: (id: string) => api.delete(`/admin/jobs/${id}`),
  getPerformance: () => api.get("/admin/performance"),
  getPayments: (params?: Record<string, unknown>) =>
    api.get("/admin/payments", { params }),
  handlePaymentDispute: (
    id: string,
    action: "refund" | "release" | "partial",
    resolution: string,
  ) => api.put(`/admin/payments/${id}/dispute`, { action, resolution }),
  markPaymentPaid: (id: string) => api.put(`/admin/payments/${id}/mark-paid`),
  // Reviews moderation
  getReviews: (params?: Record<string, unknown>) =>
    api.get("/admin/reviews", { params }),
  moderateReview: (
    id: string,
    payload: {
      moderationStatus?: "pending" | "approved" | "rejected";
      status?: "draft" | "published" | "hidden";
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
      status?: "investigating" | "resolved" | "closed";
      resolution?: string;
      hrNotes?: string;
    },
  ) => api.put(`/admin/disputes/${id}`, payload),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get("/notifications"),
  getStats: () => api.get("/notifications/stats"),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  create: (payload: {
    recipients: string[];
    title: string;
    message: string;
    type?: string;
    priority?: string;
    relatedJob?: string;
    relatedUser?: string;
    actionButton?: { text: string; url: string; action: string };
    expiresAt?: string;
  }) => api.post("/notifications/create", payload),
  sendAnnouncement: (payload: {
    title: string;
    message: string;
    targetRoles?: string[];
    priority?: string;
    expiresAt?: string;
  }) =>
    api.post("/notifications/announcement", {
      ...payload,
      // Normalize the UI value 'both' to explicit roles for backward compatibility
      targetRoles: Array.isArray(payload.targetRoles)
        ? payload.targetRoles.includes("both")
          ? ["worker", "client"]
          : payload.targetRoles
        : payload.targetRoles,
    }),
};

// Public contact API
export const contactAPI = {
  submit: (payload: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => api.post("/contact", payload),
};

export default api;
