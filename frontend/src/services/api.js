import axios from 'axios'

// Crear instancia de axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido: limpiar sesión y preservar destino
      try {
        const current = window.location.pathname + window.location.search
        sessionStorage.setItem('auth_error', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
        sessionStorage.setItem('next', current)
      } catch (_) {}
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Servicios de autenticación
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
}

// Servicios de transacciones
export const transactionService = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getCategories: () => api.get('/transactions/categories'),
  downloadAttachment: (transactionId, filename) => 
    api.get(`/transactions/${transactionId}/attachments/${filename}`, { responseType: 'blob' }),
}

// Servicios de estadísticas
export const statsService = {
  getSummary: (params) => api.get('/stats/summary', { params }),
  getCategories: (params) => api.get('/stats/categories', { params }),
  getMonthly: (params) => api.get('/stats/monthly', { params }),
  getTrends: (params) => api.get('/stats/trends', { params }),
}

// Servicios de presupuestos
export const budgetService = {
  getAll: (params) => api.get('/budgets', { params }),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
}

// Servicio de metas de ahorro
export const goalService = {
  getAll: () => api.get('/goals'),
  getById: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  notify: (data) => api.post('/goals/notify', data),
}

// Servicio de aportes a metas
export const contributionService = {
  getByGoal: (goalId) => api.get(`/contributions/${goalId}`),
  create: (data) => api.post('/contributions', data),
  update: (id, data) => api.put(`/contributions/${id}`, data),
  delete: (id) => api.delete(`/contributions/${id}`),
}

export const pushService = {
  getVapidKey: () => api.get('/goals/vapid-key'),
  subscribe: (subscription) => api.post('/goals/subscribe', { subscription }),
  send: (userId, title, body) => api.post('/goals/push', { userId, title, body }),
}

export default api 
