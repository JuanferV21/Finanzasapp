// Datos de demostración para el portafolio
export const demoUsers = [
  {
    id: 1,
    name: "Juan Fernando",
    email: "demo@finanzasdash.com",
    password: "demo123",
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    name: "Usuario Demo",
    email: "usuario@demo.com", 
    password: "123456",
    createdAt: "2024-02-01"
  }
];

export const demoTransactions = [
  {
    id: 1,
    userId: 1,
    type: "income",
    amount: 3500,
    category: "Salario",
    description: "Salario mensual",
    date: "2024-07-01",
    createdAt: "2024-07-01"
  },
  {
    id: 2,
    userId: 1,
    type: "expense",
    amount: 850,
    category: "Vivienda",
    description: "Pago de renta",
    date: "2024-07-02",
    createdAt: "2024-07-02"
  },
  {
    id: 3,
    userId: 1,
    type: "expense",
    amount: 320,
    category: "Alimentación",
    description: "Supermercado semanal",
    date: "2024-07-03",
    createdAt: "2024-07-03"
  },
  {
    id: 4,
    userId: 1,
    type: "expense",
    amount: 150,
    category: "Transporte",
    description: "Gasolina y transporte público",
    date: "2024-07-04",
    createdAt: "2024-07-04"
  },
  {
    id: 5,
    userId: 1,
    type: "income",
    amount: 500,
    category: "Freelance",
    description: "Proyecto web",
    date: "2024-07-05",
    createdAt: "2024-07-05"
  },
  {
    id: 6,
    userId: 1,
    type: "expense",
    amount: 200,
    category: "Entretenimiento",
    description: "Cine y restaurantes",
    date: "2024-07-06",
    createdAt: "2024-07-06"
  },
  {
    id: 7,
    userId: 1,
    type: "expense",
    amount: 80,
    category: "Servicios",
    description: "Internet y teléfono",
    date: "2024-07-07",
    createdAt: "2024-07-07"
  },
  {
    id: 8,
    userId: 1,
    type: "income",
    amount: 1200,
    category: "Inversiones",
    description: "Dividendos",
    date: "2024-07-08",
    createdAt: "2024-07-08"
  }
];

export const demoBudgets = [
  {
    id: 1,
    userId: 1,
    category: "Alimentación",
    budgetAmount: 500,
    spentAmount: 320,
    month: "2024-07",
    createdAt: "2024-07-01"
  },
  {
    id: 2,
    userId: 1,
    category: "Transporte",
    budgetAmount: 200,
    spentAmount: 150,
    month: "2024-07",
    createdAt: "2024-07-01"
  },
  {
    id: 3,
    userId: 1,
    category: "Entretenimiento",
    budgetAmount: 300,
    spentAmount: 200,
    month: "2024-07",
    createdAt: "2024-07-01"
  }
];

export const demoGoals = [
  {
    id: 1,
    userId: 1,
    title: "Vacaciones 2024",
    description: "Viaje a Europa",
    targetAmount: 5000,
    currentAmount: 2800,
    targetDate: "2024-12-15",
    category: "Viajes",
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    userId: 1,
    title: "Fondo de Emergencia",
    description: "6 meses de gastos",
    targetAmount: 15000,
    currentAmount: 8500,
    targetDate: "2024-12-31",
    category: "Ahorro",
    createdAt: "2024-02-01"
  }
];