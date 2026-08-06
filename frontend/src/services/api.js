import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  // login uses form-data (OAuth2PasswordRequestForm)
  login: (email, password) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    return api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionsAPI = {
  getAll: (skip = 0, limit = 100) =>
    api.get(`/api/transactions/?skip=${skip}&limit=${limit}`),
  create: (data) => api.post('/api/transactions/', data),
  uploadPreview: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/api/transactions/upload/preview', form);
  },
  uploadConfirm: (transactions) => api.post('/api/transactions/upload/confirm', transactions),
  trainCategorizer: () => api.post('/api/transactions/train-categorizer'),
  detectAnomalies: () => api.post('/api/transactions/detect-anomalies'),
  getForecast: () => api.get('/api/transactions/forecast'),
  updateCategory: (id, category) =>
    api.put(`/api/transactions/${id}/category`, { category }),
  predictCategory: (data) => api.post('/api/transactions/predict-category', data),
  getModelMetadata: () => api.get('/api/transactions/model/metadata'),
};

// ─── Analytics (AI Advisor) ───────────────────────────────────────────────────
export const analyticsAPI = {
  trainDecisionTree: () => api.post('/api/analytics/train-decision-tree'),
  getSpendingAnalysis: () => api.get('/api/analytics/spending-analysis'),
  getDecisionTreeImage: () => api.get('/api/analytics/decision-tree', { responseType: 'blob' }),
  getSavingsRecommendations: () => api.get('/api/analytics/savings-recommendations'),
};

export default api;
