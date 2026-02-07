import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/me'),
};

export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getDetails: (userId: string) => api.get(`/users/${userId}`),
  updateStatus: (userId: string, status: string) => api.patch(`/users/${userId}/status`, { status }),
  delete: (userId: string) => api.delete(`/users/${userId}`),
};

export const vendorsAPI = {
  getAll: (params?: any) => api.get('/vendors', { params }),
  approve: (vendorId: string) => api.post(`/vendors/${vendorId}/approve`),
  reject: (vendorId: string, reason: string) => api.post(`/vendors/${vendorId}/reject`, { reason }),
  suspend: (vendorId: string, reason: string) => api.post(`/vendors/${vendorId}/suspend`, { reason }),
};

export const ridersAPI = {
  getAll: (params?: any) => api.get('/riders', { params }),
  approve: (riderId: string) => api.post(`/riders/${riderId}/approve`),
  reject: (riderId: string, reason: string) => api.post(`/riders/${riderId}/reject`, { reason }),
  suspend: (riderId: string, reason: string) => api.post(`/riders/${riderId}/suspend`, { reason }),
};

export const ordersAPI = {
  getAll: (params?: any) => api.get('/orders', { params }),
  getDetails: (orderId: string) => api.get(`/orders/${orderId}`),
  cancel: (orderId: string, reason: string) => api.post(`/orders/${orderId}/cancel`, { reason }),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getRevenue: (params?: any) => api.get('/analytics/revenue', { params }),
};

export const financeAPI = {
  getPlatform: () => api.get('/finance/platform'),
  getPayouts: (params?: any) => api.get('/finance/payouts', { params }),
  processPayout: (payoutId: string) => api.post(`/finance/payouts/${payoutId}/process`),
};
