import axios from 'axios'
import { demoAPI } from './demoAuth'

// Crear instancia de axios (solo para compatibilidad)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
      // Token expirado o inválido
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
}

// Servicios de transacciones (modo demo)
export const transactionService = {
  getAll: (params) => demoAPI.getTransactions(),
  getById: (id) => Promise.resolve({}),
  create: (data) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
  update: (id, data) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
  delete: (id) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
  getCategories: () => Promise.resolve({ data: ['Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Salario', 'Freelance', 'Inversiones'] }),
  downloadAttachment: (transactionId, filename) => Promise.resolve({}),
}

// Servicios de estadísticas (modo demo)
export const statsService = {
  getSummary: (params) => demoAPI.getStats().then(data => ({ data })),
  getCategories: (params) => Promise.resolve({ data: [] }),
  getMonthly: (params) => Promise.resolve({ data: [] }),
  getTrends: () => Promise.resolve({ data: [] }),
}

// Servicios de presupuestos (modo demo)
export const budgetService = {
  getAll: (params) => demoAPI.getBudgets().then(data => ({ data })),
  create: (data) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
  delete: (id) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
};

// Servicio de metas de ahorro (modo demo)
export const goalService = {
  getAll: () => demoAPI.getGoals().then(data => ({ data })),
  create: (data) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
  update: (id, data) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
  delete: (id) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
  notify: (data) => Promise.resolve({ data: { success: true } }),
};

// Servicio de aportes a metas (modo demo)
export const contributionService = {
  getByGoal: (goalId) => Promise.resolve({ data: [] }),
  create: (data) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
  update: (id, data) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
  delete: (id) => Promise.resolve({ data: { success: true, message: 'Función deshabilitada en modo demo' } }),
};

export const pushService = {
  getVapidKey: () => Promise.resolve({ data: '' }),
  subscribe: (subscription) => Promise.resolve({ data: { success: true } }),
  send: (userId, title, body) => Promise.resolve({ data: { success: true } }),
};

export default api 