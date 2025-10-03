import { useState, useEffect } from 'react'
import { statsService, budgetService } from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  CreditCard,
  AlertTriangle,
  Target
} from 'lucide-react'
import {
  MdTrendingUp,
  MdTrendingDown,
  MdAttachMoney,
  MdAccountBalanceWallet,
  MdNorthEast,
  MdSouthEast,
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,
  MdInfo,
  MdShowChart,
  MdPieChart,
  MdBarChart,
  MdTimeline,
  MdAccountBalance,
  MdSavings
} from 'react-icons/md'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import TransactionModal from '../components/TransactionModal'
import BudgetModal from '../components/BudgetModal';
import PeriodSelector from '../components/PeriodSelector';
import { startOfMonth, format as formatDate } from 'date-fns';
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
  const [selectedPeriod, setSelectedPeriod] = useState({
    type: 'month',
    period: 0,
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
    label: 'Este mes'
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData()
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const dateParams = {
        startDate: selectedPeriod.start,
        endDate: selectedPeriod.end
      };

      // Pedimos datos del período seleccionado incluyendo tendencias
      const [summaryRes, categoriesRes, monthlyRes, trendsRes] = await Promise.all([
        statsService.getSummary(dateParams),
        statsService.getCategories(dateParams),
        statsService.getMonthly(dateParams),
        statsService.getTrends()
      ])

      setSummary(summaryRes.data)
      setCategoryStats(categoriesRes.data)
      setMonthlyData(monthlyRes.data.monthlyData || [])

      // Usar tendencias reales del endpoint
      if (trendsRes.data?.trends) {
        setTrend({
          income: trendsRes.data.trends.incomeTrend || 0,
          expense: trendsRes.data.trends.expenseTrend || 0
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
      const res = await budgetService.getAll({ month });
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

  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl"></div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-32">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gray-200 rounded-2xl"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card h-96">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-64 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Budgets & Transactions Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-40"></div>
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Resumen de tus finanzas - ${selectedPeriod.label}`}
        actions={
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-72">
              <PeriodSelector onPeriodChange={handlePeriodChange} />
            </div>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="btn-primary flex items-center gap-2 justify-center whitespace-nowrap px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-5 w-5" />
              Nueva transacción
            </button>
          </div>
        }
        gradientFrom="from-blue-50"
        gradientTo="to-indigo-50"
        borderColor="border-blue-200"
      />

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card bg-gradient-to-br from-emerald-50/80 to-green-100/80 border-emerald-200/60 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-gradient-to-br from-emerald-100 to-green-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <MdTrendingUp className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-semibold text-gray-600 mb-1">Ingresos</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {formatCurrency(summary?.summary?.totalIncome || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm gap-2">
              <MdNorthEast className="h-4 w-4 text-green-500" />
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
              {trend.income > 0 && <MdKeyboardArrowUp className="h-3 w-3 mr-1" />}
              {trend.income < 0 && <MdKeyboardArrowDown className="h-3 w-3 mr-1" />}
              {trend.income === 0 && <MdInfo className="h-3 w-3 mr-1" />}
              {Math.abs(trend.income)}%
            </span>
          </div>
        </div>

        <div className="glass-card bg-gradient-to-br from-rose-50/80 to-red-100/80 border-rose-200/60 hover:shadow-xl hover:border-rose-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-gradient-to-br from-rose-100 to-red-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <MdTrendingDown className="h-7 w-7 text-rose-600" />
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-semibold text-gray-600 mb-1">Gastos</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {formatCurrency(summary?.summary?.totalExpense || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm gap-2">
              <MdSouthEast className="h-4 w-4 text-red-500" />
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
              {trend.expense > 0 && <MdKeyboardArrowUp className="h-3 w-3 mr-1" />}
              {trend.expense < 0 && <MdKeyboardArrowDown className="h-3 w-3 mr-1" />}
              {trend.expense === 0 && <MdInfo className="h-3 w-3 mr-1" />}
              {Math.abs(trend.expense)}%
            </span>
          </div>
        </div>

        <div className="glass-card bg-gradient-to-br from-blue-50/80 to-blue-100/80 border-blue-200/60 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <MdAccountBalance className="h-7 w-7 text-blue-600" />
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-semibold text-gray-600 mb-1">Balance</p>
                <p className={`text-2xl lg:text-3xl font-bold ${
                  (summary?.summary?.balance || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {formatCurrency(summary?.summary?.balance || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm gap-2">
              <MdShowChart className="h-4 w-4 text-blue-500" />
              <span className="text-blue-600 font-medium">
                {summary?.summary?.totalTransactions || 0} total
              </span>
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full shadow-sm border border-blue-200 font-medium">
              {selectedPeriod.label}
            </span>
          </div>
        </div>

        <div className="glass-card bg-gradient-to-br from-violet-50/80 to-purple-100/80 border-violet-200/60 hover:shadow-xl hover:border-violet-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-gradient-to-br from-violet-100 to-purple-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <MdSavings className="h-7 w-7 text-violet-600" />
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-semibold text-gray-600 mb-1">Promedio de gastos</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {formatCurrency(monthlyData.length > 0 ?
                    monthlyData.reduce((sum, item) => sum + (item.expense || 0), 0) / monthlyData.length : 0
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
            <span className="text-xs text-violet-600 bg-violet-50 px-3 py-1 rounded-full shadow-sm border border-violet-200 font-medium">
              Promedio
            </span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica circular de gastos por categoría */}
        <div className="glass-card hover:shadow-xl transition-all duration-300 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MdPieChart className="h-6 w-6 text-rose-600" />
                Gastos por Categoría
              </h3>
              <p className="text-sm text-gray-600 mt-1">Distribución de gastos - {selectedPeriod.label}</p>
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
            <div className="h-72 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats.expense.categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius="65%"
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
              <PieChartIcon className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-center font-medium">No hay datos de gastos para mostrar</p>
              <p className="text-xs text-gray-400 mt-1">Agrega algunas transacciones para ver las estadísticas</p>
            </div>
          )}
        </div>

        {/* Gráfica de barras de evolución mensual */}
        <div className="glass-card hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MdBarChart className="h-6 w-6 text-blue-600" />
                Evolución Mensual
              </h3>
              <p className="text-sm text-gray-600 mt-1">Tendencia de ingresos vs gastos</p>
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
            <div className="h-72 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={70}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    domain={[0, dataMax => Math.ceil(dataMax * 1.2 / 500) * 500]}
                    tickFormatter={(value) =>
                      value === 0
                        ? '$0'
                        : value >= 1000
                          ? '$' + (value / 1000).toFixed(0) + 'k'
                          : '$' + value.toFixed(0)
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
              <BarChart3 className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-center font-medium">No hay datos mensuales para mostrar</p>
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
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3" />
                          Excedido
                        </span>
                      )}
                      {porcentaje >= 80 && porcentaje < 100 && !excedido && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3" />
                          Cerca del límite
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
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Meta alcanzada
                        </span>
                      )}
                      {porcentaje >= 80 && porcentaje < 100 && !alcanzado && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          <Target className="h-3 w-3" />
                          Cerca de la meta
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
      <div className="glass-card hover:shadow-xl transition-all duration-300 w-full max-w-full min-w-0 overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MdTimeline className="h-6 w-6 text-blue-600" />
              Transacciones Recientes
            </h3>
            <p className="text-sm text-gray-600 mt-1">Últimas transacciones registradas</p>
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
          <>
            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full w-full text-sm text-left">
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
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            {transaction.type === 'income' ? (
                              <MdTrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <MdTrendingDown className="h-4 w-4 text-red-600" />
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
                            <MdNorthEast className="h-4 w-4" />
                          ) : (
                            <MdSouthEast className="h-4 w-4" />
                          )}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {summary.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        {transaction.type === 'income' ? (
                          <MdTrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <MdTrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {transaction.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      </div>
                    </div>
                    <div className={`text-right ml-3 font-bold text-base ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                    <span className="text-xs text-gray-700 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                      {getCategoryLabel(transaction.category)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2 font-medium">No hay transacciones recientes</p>
            <p className="text-sm text-gray-400 mb-4">Comienza agregando tu primera transacción</p>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => setShowTransactionModal(true)}
            >
              <Plus className="h-4 w-4" />
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