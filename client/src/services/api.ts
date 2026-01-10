import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data: { email: string; password: string; fullName: string; role?: string }) =>
    api.post('/auth/signup', data),
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  resetPassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export const productAPI = {
  getAll: (params?: unknown) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: unknown) => api.post('/products', data),
  update: (id: number, data: unknown) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  getExpiring: (days?: number) => api.get('/products/expiring', { params: { days } }),
  search: (query: string) => api.get('/products/search', { params: { q: query } }),
  getCategories: () => api.get('/products/categories'),
};

export const saleAPI = {
  create: (data: unknown) => api.post('/sales', data),
  getAll: (params?: unknown) => api.get('/sales', { params }),
  getById: (id: number) => api.get(`/sales/${id}`),
  getInvoice: (id: number) => api.get(`/sales/invoice/${id}`),
};

export const customerAPI = {
  getAll: (params?: unknown) => api.get('/customers', { params }),
  create: (data: unknown) => api.post('/customers', data),
  update: (id: number, data: unknown) => api.put(`/customers/${id}`, data),
  getHistory: (id: number) => api.get(`/customers/${id}/history`),
};

export const supplierAPI = {
  getAll: () => api.get('/suppliers'),
  create: (data: unknown) => api.post('/suppliers', data),
  update: (id: number, data: unknown) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

export const purchaseOrderAPI = {
  getAll: (params?: unknown) => api.get('/purchase-orders', { params }),
  create: (data: unknown) => api.post('/purchase-orders', data),
  updateStatus: (id: number, data: unknown) => api.put(`/purchase-orders/${id}/status`, data),
};

export const expenseAPI = {
  getAll: (params?: unknown) => api.get('/expenses', { params }),
  create: (data: unknown) => api.post('/expenses', data),
  approve: (id: number, status: string) => api.put(`/expenses/${id}/approve`, { status }),
};

export const staffAPI = {
  getAll: () => api.get('/staff'),
  create: (data: unknown) => api.post('/staff', data),
  update: (id: number, data: unknown) => api.put(`/staff/${id}`, data),
  delete: (id: number) => api.delete(`/staff/${id}`),
};

export const reportAPI = {
  sales: (params?: unknown) => api.get('/reports/sales', { params }),
  inventory: () => api.get('/reports/inventory'),
  expenses: (params?: unknown) => api.get('/reports/expenses', { params }),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  create: (data: unknown) => api.post('/notifications', data),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: unknown) => api.put('/settings', data),
};

export default api;