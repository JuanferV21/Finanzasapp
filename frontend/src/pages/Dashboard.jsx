import { useState, useEffect } from 'react'
import { statsService } from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ArrowUp,
  ArrowDown,
  Info,
  Trophy
} from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import TransactionModal from '../components/TransactionModal'
import BudgetModal from '../components/BudgetModal';
import { startOfMonth, format as formatDate } from 'date-fns';
import { goalService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280']

const Dashboard = () => {
  const [summary, setSummary] = useState(null)
  const [categoryStats, setCategoryStats] = useState({})
  const [monthlyData, setMonthlyData] = useState([])
  const [trend, setTrend] = useState({ income: 0, expense: 0 })
  const [loading, setLoading] = useState(true)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [budgets, setBudgets] = useState([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetType, setBudgetType] = useState('expense');
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [budgetMonth, setBudgetMonth] = useState(formatDate(new Date(), 'yyyy-MM'));
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [recentAchievements, setRecentAchievements] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData()
    // Cargar metas para el resumen
    const fetchGoals = async () => {
      setGoalsLoading(true);
      try {
        const res = await goalService.getAll();
        setGoals(res.data);
      } catch {
        setGoals([]);
      } finally {
        setGoalsLoading(false);
      }
    };
    fetchGoals();
    // Cargar logros recientes de localStorage
    try {
      const all = JSON.parse(localStorage.getItem('achievements') || '[]');
      setRecentAchievements(all.slice(-3));
    } catch {
      setRecentAchievements([]);
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Pedimos los últimos 2 meses para tendencia y todos para el resto
      const [summaryRes, categoriesRes, monthlyRes, monthly2Res] = await Promise.all([
        statsService.getSummary(),
        statsService.getCategories(),
        statsService.getMonthly(),
        statsService.getMonthly({ months: 2 })
      ])

      setSummary(summaryRes.data)
      setCategoryStats(categoriesRes.data)
      setMonthlyData(monthlyRes.data.monthlyData || [])

      // Calcular tendencia
      const last2 = monthly2Res.data.monthlyData || []
      if (last2.length >= 2) {
        const prev = last2[0]
        const curr = last2[1]
        const incomeTrend = prev.income > 0 ? ((curr.income - prev.income) / prev.income) * 100 : 0
        const expenseTrend = prev.expense > 0 ? ((curr.expense - prev.expense) / prev.expense) * 100 : 0
        setTrend({
          income: Math.round(incomeTrend * 10) / 10,
          expense: Math.round(expenseTrend * 10) / 10
        })
      } else {
        setTrend({ income: 0, expense: 0 })
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar presupuestos del mes actual
  const loadBudgets = async (month = budgetMonth) => {
    try {
      const res = await statsService.getBudgets({ month });
      setBudgets(res.data);
    } catch (err) {
      setBudgets([]);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [budgetMonth]);

  // Abrir modal de presupuestos
  const handleOpenBudgetModal = (type) => {
    setBudgetType(type);
    // Cargar categorías según tipo
    if (type === 'expense') {
      setBudgetCategories(categoryStats.expense?.categories || []);
    } else {
      setBudgetCategories(categoryStats.income?.categories || []);
    }
    setShowBudgetModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getCategoryLabel = (category) => {
    const allCategories = [
      ...(categoryStats.income?.categories || []),
      ...(categoryStats.expense?.categories || [])
    ];
    const found = allCategories.find(cat => cat.value === category);
    return found ? found.label : category;
  }

  // Cálculos de resumen de metas
  const totalGoals = goals.length;
  const achievedGoals = goals.filter(g => g.montoAhorrado >= g.montoObjetivo).length;
  const globalProgress = totalGoals > 0 ? Math.round(goals.reduce((sum, g) => sum + Math.min(1, g.montoAhorrado / g.montoObjetivo), 0) / totalGoals * 100) : 0;
  const upcomingGoals = goals.filter(g => g.fechaLimite && g.montoAhorrado < g.montoObjetivo && new Date(g.fechaLimite) - new Date() < 1000*60*60*24*14);

  // Logros (puedes sincronizar con los de Goals.jsx)
  const LOGROS = [
    { key: 'first_goal', label: '¡Primera meta creada!', emoji: '🌱' },
    { key: 'first_achieved', label: '¡Primera meta alcanzada!', emoji: '🏁' },
    { key: 'three_achieved', label: '¡3 metas alcanzadas!', emoji: '🥉' },
    { key: 'three_contributions_month', label: '¡3 aportes en un mes!', emoji: '📅' },
    { key: 'early_achiever', label: '¡Meta antes de la fecha límite!', emoji: '⏰' },
    { key: 'big_contribution', label: '¡Aporte gigante!', emoji: '💰' },
    { key: 'goal_1000', label: '¡Meta de $1000!', emoji: '💎' },
    { key: 'six_months_saving', label: '¡6 meses seguidos ahorrando!', emoji: '📈' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Resumen de tus finanzas personales"
        actions={
          <button
            onClick={() => setShowTransactionModal(true)}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" />
            Nueva transacción
          </button>
        }
        gradientFrom="from-yellow-50"
        gradientTo="to-orange-50"
        borderColor="border-yellow-200"
      />

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-card bg-gradient-to-br from-green-50/50 to-green-100/50 border-green-200/50 hover:shadow-lg transition-all duration-300 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.summary?.totalIncome || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">
                {summary?.summary?.incomeCount || 0} transacciones
              </span>
            </div>
            {/* Indicador de tendencia mejorado */}
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-all duration-200
                ${trend.income > 0 ? 'bg-green-100 text-green-700 border border-green-200' : ''}
                ${trend.income < 0 ? 'bg-red-100 text-red-700 border border-red-200' : ''}
                ${trend.income === 0 ? 'bg-gray-100 text-gray-500 border border-gray-200' : ''}
              `}
              title={trend.income > 0 ? 'Ingresos subieron respecto al mes anterior' : trend.income < 0 ? 'Ingresos bajaron respecto al mes anterior' : 'Sin cambio respecto al mes anterior'}
            >
              {trend.income > 0 && <ArrowUp className="h-3 w-3 mr-1" />}
              {trend.income < 0 && <ArrowDown className="h-3 w-3 mr-1" />}
              {trend.income === 0 && <Info className="h-3 w-3 mr-1" />}
              {Math.abs(trend.income)}%
            </span>
          </div>
        </div>

        <div className="glass-card bg-gradient-to-br from-red-50/50 to-red-100/50 border-red-200/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center shadow-sm">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gastos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.summary?.totalExpense || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              <span className="text-red-600 font-medium">
                {summary?.summary?.expenseCount || 0} transacciones
              </span>
            </div>
            {/* Indicador de tendencia mejorado */}
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-all duration-200
                ${trend.expense > 0 ? 'bg-red-100 text-red-700 border border-red-200' : ''}
                ${trend.expense < 0 ? 'bg-green-100 text-green-700 border border-green-200' : ''}
                ${trend.expense === 0 ? 'bg-gray-100 text-gray-500 border border-gray-200' : ''}
              `}
              title={trend.expense > 0 ? 'Gastos subieron respecto al mes anterior' : trend.expense < 0 ? 'Gastos bajaron respecto al mes anterior' : 'Sin cambio respecto al mes anterior'}
            >
              {trend.expense > 0 && <ArrowUp className="h-3 w-3 mr-1" />}
              {trend.expense < 0 && <ArrowDown className="h-3 w-3 mr-1" />}
              {trend.expense === 0 && <Info className="h-3 w-3 mr-1" />}
              {Math.abs(trend.expense)}%
            </span>
          </div>
        </div>

        <div className="glass-card bg-gradient-to-br from-blue-50/50 to-blue-100/50 border-blue-200/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Balance</p>
                <p className={`text-2xl font-bold ${
                  (summary?.summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(summary?.summary?.balance || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm gap-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span className="text-blue-600 font-medium">
                {summary?.summary?.totalTransactions || 0} total
              </span>
            </div>
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full shadow-sm">
              Este mes
            </span>
          </div>
        </div>

        <div className="glass-card bg-gradient-to-br from-purple-50/50 to-purple-100/50 border-purple-200/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio mensual</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(monthlyData.length > 0 ? 
                    monthlyData.reduce((sum, item) => sum + item.balance, 0) / monthlyData.length : 0
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm gap-2">
              <span className="text-purple-600 font-medium">
                Últimos {monthlyData.length} meses
              </span>
            </div>
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full shadow-sm">
              Promedio
            </span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Gráfica circular de gastos por categoría */}
        <div className="glass-card hover:shadow-lg transition-all duration-300 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gastos por Categoría</h3>
              <p className="text-sm text-gray-600">Distribución de gastos del mes actual</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn-secondary text-xs px-3 py-1" 
                onClick={() => navigate('/reports')}
                title="Ver reportes detallados"
              >
                Ver reportes
              </button>
            </div>
          </div>
          {categoryStats.expense?.categories?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats.expense.categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryStats.expense.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => getCategoryLabel(label)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-center">No hay datos de gastos para mostrar</p>
              <p className="text-xs text-gray-400 mt-1">Agrega algunas transacciones para ver las estadísticas</p>
            </div>
          )}
        </div>

        {/* Gráfica de barras de evolución mensual */}
        <div className="glass-card hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Evolución Mensual</h3>
              <p className="text-sm text-gray-600">Tendencia de ingresos vs gastos</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn-secondary text-xs px-3 py-1" 
                onClick={() => navigate('/reports')}
                title="Ver reportes detallados"
              >
                Ver reportes
              </button>
            </div>
          </div>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={60}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    domain={[0, dataMax => Math.ceil(dataMax * 1.2 / 500) * 500]}
                    tickFormatter={(value) =>
                      value === 0
                        ? '0 US$'
                        : value >= 1000
                          ? value.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' US$'
                          : value.toFixed(0) + ' US$'
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => label}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="income" fill="#10B981" name="Ingresos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#EF4444" name="Gastos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-center">No hay datos mensuales para mostrar</p>
              <p className="text-xs text-gray-400 mt-1">Agrega transacciones para ver la evolución</p>
            </div>
          )}
        </div>
      </div>

      {/* Barras de progreso de presupuesto por categoría de gastos */}
      {budgetCategories.length > 0 && budgetType === 'expense' && budgets.length > 0 && (
        <div className="glass-card hover:shadow-lg transition-all duration-300 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Progreso de Presupuesto - Gastos</h3>
              <p className="text-sm text-gray-600">Control de gastos por categoría este mes</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn-secondary text-xs px-3 py-1" 
                onClick={() => navigate('/budgets')}
                title="Gestionar presupuestos"
              >
                Gestionar
              </button>
              <button 
                className="btn-primary text-xs px-3 py-1" 
                onClick={() => handleOpenBudgetModal('expense')}
                title="Agregar presupuesto"
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {budgetCategories.map(cat => {
              const budget = budgets.find(b => b.category === cat.value && b.type === 'expense');
              if (!budget) return null;
              // Calcular lo gastado en la categoría este mes
              const gasto = (categoryStats.expense?.categories || []).find(c => c.value === cat.value)?.value || 0;
              const porcentaje = Math.min(100, Math.round((gasto / budget.amount) * 100));
              const excedido = gasto > budget.amount;
              const restante = budget.amount - gasto;
              
              return (
                <div key={cat.value} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                      {excedido && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          ⚠️ Excedido
                        </span>
                      )}
                      {porcentaje >= 80 && porcentaje < 100 && !excedido && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          ⚠️ Cerca del límite
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(gasto)} / {formatCurrency(budget.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {excedido ? `+${formatCurrency(Math.abs(restante))}` : `${formatCurrency(restante)} restante`}
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ease-out ${
                        excedido ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                        porcentaje >= 80 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                        'bg-gradient-to-r from-green-500 to-green-600'
                      }`}
                      style={{ width: `${porcentaje > 100 ? 100 : porcentaje}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {porcentaje}% utilizado
                    </span>
                    {excedido && (
                      <span className="text-xs text-red-600 font-semibold">
                        ¡Excediste el presupuesto en {formatCurrency(Math.abs(restante))}!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barras de progreso de presupuesto por categoría de ingresos */}
      {budgetCategories.length > 0 && budgetType === 'income' && budgets.length > 0 && (
        <div className="glass-card hover:shadow-lg transition-all duration-300 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Progreso de Presupuesto - Ingresos</h3>
              <p className="text-sm text-gray-600">Control de ingresos por categoría este mes</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn-secondary text-xs px-3 py-1" 
                onClick={() => navigate('/budgets')}
                title="Gestionar presupuestos"
              >
                Gestionar
              </button>
              <button 
                className="btn-primary text-xs px-3 py-1" 
                onClick={() => handleOpenBudgetModal('income')}
                title="Agregar presupuesto"
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {budgetCategories.map(cat => {
              const budget = budgets.find(b => b.category === cat.value && b.type === 'income');
              if (!budget) return null;
              // Calcular lo ingresado en la categoría este mes
              const ingreso = (categoryStats.income?.categories || []).find(c => c.value === cat.value)?.value || 0;
              const porcentaje = Math.min(100, Math.round((ingreso / budget.amount) * 100));
              const alcanzado = ingreso >= budget.amount;
              const restante = budget.amount - ingreso;
              
              return (
                <div key={cat.value} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                      {alcanzado && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ✅ Meta alcanzada
                        </span>
                      )}
                      {porcentaje >= 80 && porcentaje < 100 && !alcanzado && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          🎯 Cerca de la meta
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(ingreso)} / {formatCurrency(budget.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {alcanzado ? `+${formatCurrency(ingreso - budget.amount)} extra` : `${formatCurrency(restante)} restante`}
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ease-out ${
                        alcanzado ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                        porcentaje >= 80 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                        'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`}
                      style={{ width: `${porcentaje > 100 ? 100 : porcentaje}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {porcentaje}% de la meta
                    </span>
                    {alcanzado && (
                      <span className="text-xs text-green-600 font-semibold">
                        ¡Meta superada en {formatCurrency(ingreso - budget.amount)}!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transacciones recientes */}
      <div className="glass-card hover:shadow-lg transition-all duration-300 w-full max-w-full min-w-0 overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Transacciones Recientes</h3>
            <p className="text-sm text-gray-600">Últimas transacciones registradas</p>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn-secondary text-xs px-3 py-1" 
              onClick={() => navigate('/transactions')}
              title="Ver todas las transacciones"
            >
              Ver todas
            </button>
            <button 
              className="btn-primary text-xs px-3 py-1" 
              onClick={() => setShowTransactionModal(true)}
              title="Agregar nueva transacción"
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar
            </button>
          </div>
        </div>
        {summary?.recentTransactions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.recentTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          {transaction.type === 'income' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                              transaction.type === 'income' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                        {getCategoryLabel(transaction.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💳</div>
            <p className="text-gray-500 mb-2">No hay transacciones recientes</p>
            <p className="text-sm text-gray-400 mb-4">Comienza agregando tu primera transacción</p>
            <button 
              className="btn-primary"
              onClick={() => setShowTransactionModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar transacción
            </button>
          </div>
        )}
      </div>

      {/* Modal de nueva transacción */}
      {showTransactionModal && (
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSuccess={() => {
            setShowTransactionModal(false)
            loadDashboardData()
          }}
        />
      )}

      {/* Modal de presupuestos */}
      {showBudgetModal && (
        <BudgetModal
          isOpen={showBudgetModal}
          onClose={() => setShowBudgetModal(false)}
          categories={budgetCategories}
          type={budgetType}
          month={budgetMonth}
          initialBudgets={budgets.filter(b => b.type === budgetType)}
          onSuccess={() => {
            setShowBudgetModal(false);
            loadBudgets();
            loadDashboardData();
          }}
        />
      )}
    </div>
  )
}

export default Dashboard 