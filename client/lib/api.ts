import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (userData: Record<string, unknown>) =>
    api.post('/auth/register', userData),
  loginWithGoogle: (credential: string, role?: 'worker'|'client') =>
    api.post('/auth/google', { credential, role }),
  getMe: () =>
    api.get('/auth/me'),
  logout: () =>
    api.post('/auth/logout'),
  updateProfile: (profileData: Record<string, unknown>) =>
    api.put('/auth/profile', profileData),
};

// Jobs API
export const jobsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/jobs', { params }),
  getById: (id: string) =>
    api.get(`/jobs/${id}`),
  apply: (
    id: string,
    proposal: string,
    proposedBudget: number,
    extras?: { estimatedDuration?: string; coverLetter?: string }
  ) =>
    api.post(`/jobs/${id}/apply`, { proposal, proposedBudget, ...(extras || {}) }),
  getCategories: () =>
    api.get('/jobs/categories'),
  search: (query: string, params?: Record<string, unknown>) =>
    api.get('/jobs/search', { params: { q: query, ...(params || {}) } }),
  getStats: () =>
    api.get('/jobs/stats'),
};

// Client API
export const clientAPI = {
  getDashboard: () =>
    api.get('/client/dashboard'),
  getJobs: () =>
    api.get('/client/jobs'),
  createJob: (jobData: Record<string, unknown>) =>
    api.post('/client/jobs', jobData),
  getJob: (id: string) =>
    api.get(`/client/jobs/${id}`),
  updateJob: (id: string, jobData: Record<string, unknown>) =>
    api.put(`/client/jobs/${id}`, jobData),
  acceptApplication: (jobId: string, applicationId: string) =>
    api.put(`/client/jobs/${jobId}/applications/${applicationId}/accept`),
  rejectApplication: (jobId: string, applicationId: string) =>
    api.put(`/client/jobs/${jobId}/applications/${applicationId}/reject`),
  completeJob: (id: string) =>
    api.put(`/client/jobs/${id}/complete`),
  completeJobWithRating: (id: string, rating: number, review: string) =>
    api.put(`/client/jobs/${id}/complete`, { rating, review }),
  requestRevision: (id: string, reason: string) =>
    api.put(`/client/jobs/${id}/request-revision`, { reason }),
  getPayments: () =>
    api.get('/client/payments'),
  getJobMessages: (jobId: string) =>
    api.get(`/client/jobs/${jobId}/messages`),
  sendJobMessage: (jobId: string, content: string, attachments?: string[]) =>
    api.post(`/client/jobs/${jobId}/messages`, { content, attachments }),
};

// Worker API
export const workerAPI = {
  getDashboard: () =>
    api.get('/worker/dashboard'),
  getJobs: () =>
    api.get('/worker/jobs'),
  getJob: (id: string) =>
    api.get(`/worker/jobs/${id}`),
  updateJobStatus: (id: string, status: string, progress?: number) =>
  api.put(`/worker/jobs/${id}/status`, { status, progressPercentage: progress }),
  getApplications: () =>
    api.get('/worker/applications'),
  withdrawApplication: (id: string) =>
    api.delete(`/worker/applications/${id}`),
  updateProfile: (profileData: Record<string, unknown>) =>
    api.put('/worker/profile', profileData),
  getEarnings: () =>
    api.get('/worker/earnings'),
  getJobMessages: (jobId: string) =>
    api.get(`/worker/jobs/${jobId}/messages`),
  sendJobMessage: (jobId: string, content: string, attachments?: string[]) =>
    api.post(`/worker/jobs/${jobId}/messages`, { content, attachments }),
  declineAssignedJob: (jobId: string) =>
    api.put(`/worker/jobs/${jobId}/decline`),
  acceptAssignedJob: (jobId: string) =>
    api.put(`/worker/jobs/${jobId}/accept`),
  // Saved jobs
  getSavedJobs: () => api.get('/worker/saved-jobs'),
  saveJob: (jobId: string) => api.post(`/worker/saved-jobs/${jobId}`),
  unsaveJob: (jobId: string) => api.delete(`/worker/saved-jobs/${jobId}`),
  // Reviews
  reviewClient: (jobId: string, payload: { rating: number; comment: string; title?: string }) =>
    api.post(`/worker/jobs/${jobId}/review`, payload),
};

// Admin API
export const adminAPI = {
  getDashboard: () =>
    api.get('/admin/dashboard'),
  getUsers: (params?: Record<string, unknown>) =>
    api.get('/admin/users', { params }),
  getUser: (id: string) =>
    api.get(`/admin/users/${id}`),
  updateUser: (id: string, userData: Record<string, unknown>) =>
    api.put(`/admin/users/${id}`, userData),
  deactivateUser: (id: string, reason?: string) =>
    api.put(`/admin/users/${id}/deactivate`, { reason }),
  activateUser: (id: string) =>
    api.put(`/admin/users/${id}/activate`),
  verifyWorker: (id: string) =>
    api.put(`/admin/verify-worker/${id}`),
  getAllJobs: () =>
    api.get('/admin/jobs'),
  createJob: (payload: Record<string, unknown>) =>
    api.post('/admin/jobs', payload),
  updateJob: (id: string, payload: Record<string, unknown>) =>
    api.put(`/admin/jobs/${id}`, payload),
  deleteJob: (id: string) =>
    api.delete(`/admin/jobs/${id}`),
  getPerformance: () =>
    api.get('/admin/performance'),
  getPayments: () =>
    api.get('/admin/payments'),
  handlePaymentDispute: (id: string, action: 'refund' | 'release' | 'partial', resolution: string) =>
    api.put(`/admin/payments/${id}/dispute`, { action, resolution }),
  markPaymentPaid: (id: string) =>
    api.put(`/admin/payments/${id}/mark-paid`),
  // Reviews moderation
  getReviews: (params?: Record<string, unknown>) =>
    api.get('/admin/reviews', { params }),
  moderateReview: (id: string, payload: { moderationStatus?: 'pending'|'approved'|'rejected'; status?: 'draft'|'published'|'hidden'; isPublic?: boolean }) =>
    api.put(`/admin/reviews/${id}`, payload),
};

// Notifications API
export const notificationsAPI = {
  getAll: () =>
    api.get('/notifications'),
  getStats: () =>
    api.get('/notifications/stats'),
  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
  delete: (id: string) =>
    api.delete(`/notifications/${id}`),
};

// Public contact API
export const contactAPI = {
  submit: (payload: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    api.post('/contact', payload),
};

export default api;
