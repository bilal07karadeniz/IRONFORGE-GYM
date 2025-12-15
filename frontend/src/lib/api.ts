import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        setTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  }) => api.patch('/auth/profile', data),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Bookings API
export const bookingsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/bookings', { params }),

  getById: (id: string) => api.get(`/bookings/${id}`),

  create: (data: { timeSlotId: string; date: string }) =>
    api.post('/bookings', data),

  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),

  getStats: () => api.get('/bookings/stats'),
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),

  // User Management
  getUsers: (params?: { role?: string; search?: string; page?: number }) =>
    api.get('/admin/users', { params }),
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),

  // Booking Management
  getAllBookings: (params?: { status?: string; dateFrom?: string; dateTo?: string }) =>
    api.get('/admin/bookings', { params }),

  // Class Management
  createClass: (data: any) => api.post('/classes', data),
  updateClass: (id: string, data: any) => api.put(`/classes/${id}`, data),
  deleteClass: (id: string) => api.delete(`/classes/${id}`),

  // Schedule Management
  createSchedule: (data: any) => api.post('/schedules', data),
  updateSchedule: (id: string, data: any) => api.put(`/schedules/${id}`, data),
  deleteSchedule: (id: string) => api.delete(`/schedules/${id}`),
};

// Trainer API
export const trainerApi = {
  getDashboard: () => api.get('/trainer/dashboard'),
  getStudents: (params?: { classId?: string }) => api.get('/trainer/students', { params }),
};

// Time Slots API
export const timeSlotsApi = {
  getAll: (params?: { date?: string; trainerId?: string }) =>
    api.get('/time-slots', { params }),

  getById: (id: string) => api.get(`/time-slots/${id}`),
};

// Trainers API
export const trainersApi = {
  getAll: () => api.get('/trainers'),
  getById: (id: string) => api.get(`/trainers/${id}`),
};

// Classes API
export const classesApi = {
  getAll: (params?: {
    search?: string;
    category?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => api.get('/classes', { params }),

  getById: (id: string) => api.get(`/classes/${id}`),

  getCategories: () => api.get('/classes/categories'),
};

// Schedules API
export const schedulesApi = {
  getAll: (params?: {
    dateFrom?: string;
    dateTo?: string;
    classId?: string;
    trainerId?: string;
    page?: number;
    limit?: number;
  }) => api.get('/schedules', { params }),

  getById: (id: string) => api.get(`/schedules/${id}`),

  book: (scheduleId: string) => api.post(`/schedules/${scheduleId}/book`),

  joinWaitlist: (scheduleId: string) => api.post(`/schedules/${scheduleId}/waitlist`),

  checkConflicts: (scheduleId: string) => api.get(`/schedules/${scheduleId}/conflicts`),
};

export default api;
