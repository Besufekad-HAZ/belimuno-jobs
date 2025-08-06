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
  register: (userData: any) =>
    api.post('/auth/register', userData),
  getMe: () =>
    api.get('/auth/me'),
  logout: () =>
    api.post('/auth/logout'),
};

// Jobs API
export const jobsAPI = {
  getAll: (params?: any) =>
    api.get('/jobs', { params }),
  getById: (id: string) =>
    api.get(`/jobs/${id}`),
  apply: (id: string, proposal: string, proposedBudget: number) =>
    api.post(`/jobs/${id}/apply`, { proposal, proposedBudget }),
  getCategories: () =>
    api.get('/jobs/categories'),
  search: (query: string) =>
    api.get('/jobs/search', { params: { q: query } }),
  getStats: () =>
    api.get('/jobs/stats'),
};

// Client API
export const clientAPI = {
  getDashboard: () =>
    api.get('/client/dashboard'),
  getJobs: () =>
    api.get('/client/jobs'),
  createJob: (jobData: any) =>
    api.post('/client/jobs', jobData),
  getJob: (id: string) =>
    api.get(`/client/jobs/${id}`),
  updateJob: (id: string, jobData: any) =>
    api.put(`/client/jobs/${id}`, jobData),
  acceptApplication: (jobId: string, applicationId: string) =>
    api.put(`/client/jobs/${jobId}/applications/${applicationId}/accept`),
  rejectApplication: (jobId: string, applicationId: string) =>
    api.put(`/client/jobs/${jobId}/applications/${applicationId}/reject`),
  completeJob: (id: string) =>
    api.put(`/client/jobs/${id}/complete`),
  requestRevision: (id: string, reason: string) =>
    api.put(`/client/jobs/${id}/request-revision`, { reason }),
  getPayments: () =>
    api.get('/client/payments'),
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
    api.put(`/worker/jobs/${id}/status`, { status, progress }),
  getApplications: () =>
    api.get('/worker/applications'),
  withdrawApplication: (id: string) =>
    api.delete(`/worker/applications/${id}`),
  updateProfile: (profileData: any) =>
    api.put('/worker/profile', profileData),
  getEarnings: () =>
    api.get('/worker/earnings'),
};

// Area Manager API
export const areaManagerAPI = {
  getDashboard: () =>
    api.get('/area-manager/dashboard'),
  getWorkers: () =>
    api.get('/area-manager/workers'),
  verifyWorker: (id: string) =>
    api.put(`/area-manager/workers/${id}/verify`),
  getJobs: () =>
    api.get('/area-manager/jobs'),
  getApplications: () =>
    api.get('/area-manager/applications'),
  escalateJob: (id: string, reason: string) =>
    api.put(`/area-manager/jobs/${id}/escalate`, { reason }),
  getPerformance: () =>
    api.get('/area-manager/performance'),
  updateRegionSettings: (settings: any) =>
    api.put('/area-manager/region/settings', settings),
};

// Admin API
export const adminAPI = {
  getDashboard: () =>
    api.get('/admin/dashboard'),
  getUsers: (params?: any) =>
    api.get('/admin/users', { params }),
  getUser: (id: string) =>
    api.get(`/admin/users/${id}`),
  updateUser: (id: string, userData: any) =>
    api.put(`/admin/users/${id}`, userData),
  deactivateUser: (id: string) =>
    api.put(`/admin/users/${id}/deactivate`),
  verifyWorker: (id: string) =>
    api.put(`/admin/verify-worker/${id}`),
  getAllJobs: () =>
    api.get('/admin/jobs'),
  getPerformance: () =>
    api.get('/admin/performance'),
  getPayments: () =>
    api.get('/admin/payments'),
  handlePaymentDispute: (id: string, resolution: string) =>
    api.put(`/admin/payments/${id}/dispute`, { resolution }),
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

export default api;