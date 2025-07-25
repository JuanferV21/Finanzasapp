import { demoUsers, demoTransactions, demoBudgets, demoGoals } from '../data/demoData.js';

// Simular delay de red
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Sistema de autenticación local para demo
export const demoAuthService = {
  // Login demo
  async login(email, password) {
    await delay(500); // Simular delay de red
    
    const user = demoUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Credenciales inválidas');
    }
    
    // Crear token falso
    const token = `demo_${user.id}_${Date.now()}`;
    
    // Guardar en localStorage
    localStorage.setItem('demo_token', token);
    localStorage.setItem('demo_user', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email
    }));
    
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  },
  
  // Verificar si está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('demo_token');
  },
  
  // Obtener usuario actual
  getCurrentUser() {
    const userStr = localStorage.getItem('demo_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  // Logout
  logout() {
    localStorage.removeItem('demo_token');
    localStorage.removeItem('demo_user');
  }
};

// API simulada para datos
export const demoAPI = {
  // Obtener transacciones
  async getTransactions() {
    await delay(300);
    const user = demoAuthService.getCurrentUser();
    if (!user) throw new Error('No autenticado');
    
    return demoTransactions.filter(t => t.userId === user.id);
  },
  
  // Obtener presupuestos
  async getBudgets() {
    await delay(300);
    const user = demoAuthService.getCurrentUser();
    if (!user) throw new Error('No autenticado');
    
    return demoBudgets.filter(b => b.userId === user.id);
  },
  
  // Obtener metas
  async getGoals() {
    await delay(300);
    const user = demoAuthService.getCurrentUser();
    if (!user) throw new Error('No autenticado');
    
    return demoGoals.filter(g => g.userId === user.id);
  },
  
  // Obtener estadísticas
  async getStats() {
    await delay(300);
    const transactions = await this.getTransactions();
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
      transactionCount: transactions.length
    };
  },

  // Obtener estadísticas por categoría
  async getCategoryStats() {
    await delay(300);
    const transactions = await this.getTransactions();
    
    const categoryTotals = {};
    transactions.forEach(t => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = { income: 0, expense: 0 };
      }
      categoryTotals[t.category][t.type] += t.amount;
    });

    const categoryData = Object.entries(categoryTotals).map(([category, data]) => ({
      category,
      ...data,
      total: data.income + data.expense
    }));

    return {
      categoryData,
      topCategories: categoryData.sort((a, b) => b.total - a.total).slice(0, 5)
    };
  },

  // Obtener datos mensuales
  async getMonthlyStats() {
    await delay(300);
    
    return {
      monthlyData: [
        {
          month: '2024-06',
          income: 3200,
          expense: 1850,
          balance: 1350,
          transactions: 15
        },
        {
          month: '2024-07',
          income: 4000,
          expense: 1900,
          balance: 2100,
          transactions: 18
        }
      ]
    };
  }
};