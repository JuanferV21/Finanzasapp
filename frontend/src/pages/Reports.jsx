import React, { useState, useEffect, useRef } from 'react';
// Si ya usas Recharts en Dashboard, puedes usarlo aquí también
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { statsService, transactionService, budgetService } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Modal } from '@mui/material'; // Usar un modal simple, puedes cambiarlo por otro si prefieres
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Calendar,
  Download,
  FileText,
  Filter,
  Info,
  Target,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AdvancedReports from '../components/AdvancedReports';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('standard'); // 'standard' o 'advanced'
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Datos reales
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topGastos, setTopGastos] = useState([]);
  const [topIngresos, setTopIngresos] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTransactions, setModalTransactions] = useState([]);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  // Eliminar todo lo relacionado con darkMode, orderBy, closeModalBtnRef, y los estilos oscuros
  // Restaurar la cabecera original:
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Resumen ingresos vs gastos
        const summaryRes = await statsService.getSummary(filters);
        setSummary(summaryRes.data.summary);

        // 2. Gastos por categoría (solo gastos)
        const catRes = await statsService.getCategories({ ...filters, type: 'expense' });
        setCategoryData(catRes.data.expense?.categories || []);

        // 3. Evolución mensual
        const monthlyRes = await statsService.getMonthly();
        setMonthlyData(monthlyRes.data.monthlyData || []);

        // 4. Top 5 gastos e ingresos
        const txRes = await transactionService.getAll({ ...filters, limit: 1000 });
        const txs = txRes.data.transactions || [];
        setTopGastos(
          txs.filter(t => t.type === 'expense')
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map(t => ({ desc: t.description, monto: t.amount }))
        );
        setTopIngresos(
          txs.filter(t => t.type === 'income')
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map(t => ({ desc: t.description, monto: t.amount }))
        );

        // 5. Presupuestos vs realidad (usar mes del filtro si existe)
        let monthStr;
        if (filters.startDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.startDate)) {
          // Si el filtro es por mes, extraer año-mes
          monthStr = filters.startDate.slice(0, 7);
        } else {
          // Por defecto, mes actual
          const now = new Date();
          monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        const budgetsRes = await budgetService.getAll({ month: monthStr });
        setBudgets(budgetsRes.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Error cargando los reportes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const summaryData = [
    { name: 'Ingresos', value: summary.totalIncome },
    { name: 'Gastos', value: summary.totalExpense }
  ];

  // Helpers para filtros rápidos
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const setQuickFilter = (type) => {
    let startDate = '';
    let endDate = '';
    if (type === 'month') {
      startDate = `${yyyy}-${mm}-01`;
      endDate = `${yyyy}-${mm}-${dd}`;
    } else if (type === 'lastMonth') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthYear = lastMonth.getFullYear();
      const lastMonthMonth = String(lastMonth.getMonth() + 1).padStart(2, '0');
      const lastMonthLastDay = new Date(lastMonthYear, lastMonth.getMonth() + 1, 0).getDate();
      startDate = `${lastMonthYear}-${lastMonthMonth}-01`;
      endDate = `${lastMonthYear}-${lastMonthMonth}-${lastMonthLastDay}`;
    } else if (type === 'year') {
      startDate = `${yyyy}-01-01`;
      endDate = `${yyyy}-${mm}-${dd}`;
    } else if (type === 'all') {
      startDate = '';
      endDate = '';
    }
    setFilters({ startDate, endDate });
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    setExportingCSV(true);
    setTimeout(() => { // Simula tiempo de exportación
      let csv = '';
      // Resumen
      csv += 'Resumen,Ingresos,Gastos\n';
      csv += `Totales,${summary.totalIncome},${summary.totalExpense}\n\n`;
      // Gastos por categoría
      csv += 'Gastos por Categoría\nCategoría,Monto\n';
      categoryData.forEach(cat => {
        csv += `${cat.name},${cat.value}\n`;
      });
      csv += '\n';
      // Evolución mensual
      csv += 'Evolución Mensual\nMes,Ingresos,Gastos\n';
      monthlyData.forEach(m => {
        csv += `${m.month},${m.income},${m.expense}\n`;
      });
      csv += '\n';
      // Top gastos
      csv += 'Top Gastos\nDescripción,Monto\n';
      topGastos.forEach(g => {
        csv += `${g.desc},${g.monto}\n`;
      });
      csv += '\n';
      // Top ingresos
      csv += 'Top Ingresos\nDescripción,Monto\n';
      topIngresos.forEach(g => {
        csv += `${g.desc},${g.monto}\n`;
      });
      csv += '\n';
      // Presupuestos vs Realidad
      csv += 'Presupuestos vs Realidad\nCategoría,Presupuesto,Gastado,Diferencia\n';
      budgets.forEach(p => {
        const cat = categoryData.find(c => c.name === p.category) || {};
        const gastado = cat.value || 0;
        csv += `${p.category},${p.amount},${gastado},${gastado - p.amount}\n`;
      });
      // Descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `reportes_finanzas_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportingCSV(false);
    }, 800);
  };

  // Exportar a PDF
  const handleExportPDF = async () => {
    setExportingPDF(true);
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Ajustar imagen al ancho de la página
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save(`reportes_finanzas_${new Date().toISOString().slice(0,10)}.pdf`);
    setExportingPDF(false);
  };

  // Función para mostrar detalle de transacciones por categoría
  const handleBarClick = async (data) => {
    setModalTitle(`Transacciones de "${data.name}"`);
    setModalOpen(true);
    setModalTransactions([]);
    try {
      const txRes = await transactionService.getAll({ ...filters, category: data.name, limit: 100 });
      setModalTransactions(txRes.data.transactions || []);
    } catch (err) {
      setModalTransactions([]);
    }
  };

  // Función para mostrar detalle de transacciones por mes
  const handleLineClick = async (data) => {
    if (!data || !data.month) return;
    setModalTitle(`Transacciones de "${data.month}"`);
    setModalOpen(true);
    setModalTransactions([]);
    // Extraer año y mes del string "Mes Año"
    const [mesStr, yearStr] = data.month.split(' ');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthNum = meses.findIndex(m => m === mesStr) + 1;
    const startDate = `${yearStr}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(Number(yearStr), monthNum, 0).getDate();
    const endDate = `${yearStr}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
    try {
      const txRes = await transactionService.getAll({ startDate, endDate, limit: 100 });
      setModalTransactions(txRes.data.transactions || []);
    } catch (err) {
      setModalTransactions([]);
    }
  };

  // Custom Tooltip para Gastos por Categoría
  const CategoryTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-2 rounded shadow text-xs border border-gray-200">
          <div><b>{d.name}</b></div>
          <div>Monto: <b>${d.value}</b></div>
          <div>Transacciones: <b>{d.count}</b></div>
          <div>Porcentaje: <b>{d.percentage}%</b></div>
        </div>
      );
    }
    return null;
  };

  // Skeleton loader
  const Skeleton = ({ height = 32, width = '100%' }) => (
    <div style={{ height, width }} className="bg-gray-200 animate-pulse rounded mb-2" />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        subtitle="Visualiza y exporta tus reportes financieros"
        actions={
          activeTab === 'standard' ? (
            <>
              <button className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center" onClick={handleExportCSV} disabled={exportingCSV}>
                <Download className="h-4 w-4" />
                {exportingCSV ? 'Exportando...' : 'Exportar CSV'}
              </button>
              <button className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center" onClick={handleExportPDF} disabled={exportingPDF}>
                <FileText className="h-4 w-4" />
                {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
              </button>
            </>
          ) : null
        }
        gradientFrom="from-blue-50"
        gradientTo="to-purple-50"
        borderColor="border-blue-200"
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('standard')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'standard'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Reportes Estándar
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'advanced'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Reportes Avanzados
        </button>
      </div>

      {/* Contenido según pestaña activa */}
      {activeTab === 'standard' ? (
        <>
          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2 mb-2">
            <button className="btn-secondary text-xs" onClick={() => setQuickFilter('month')}>Este mes</button>
            <button className="btn-secondary text-xs" onClick={() => setQuickFilter('lastMonth')}>Mes anterior</button>
            <button className="btn-secondary text-xs" onClick={() => setQuickFilter('year')}>Este año</button>
            <button className="btn-secondary text-xs" onClick={() => setQuickFilter('all')}>Todo</button>
          </div>

      {/* Gráficas y tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6" ref={reportRef}>
        {/* Gráfica de pastel ingresos vs gastos */}
        <div className="glass-card w-full max-w-full min-w-0 flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> Ingresos vs Gastos</h2>
          {loading ? <Skeleton height={200} /> : (
            summaryData.every(d => d.value === 0) ? (
              <div className="text-gray-500 text-center py-8">No hay datos suficientes para mostrar la gráfica de ingresos vs gastos.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220} minWidth={220}>
                <PieChart>
                  <Pie
                    data={summaryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {summaryData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )
          )}
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{background: COLORS[0]}}></span> Ingresos: <b>${summary.totalIncome.toLocaleString()}</b></div>
            <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{background: COLORS[1]}}></span> Gastos: <b>${summary.totalExpense.toLocaleString()}</b></div>
          </div>
        </div>

        {/* Gráfica de barras de gastos por categoría */}
        <div className="glass-card w-full max-w-full min-w-0 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Gastos por Categoría</h2>
          {loading ? <Skeleton height={200} /> : (
            categoryData.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No hay gastos registrados en este periodo.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220} minWidth={220}>
                <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={handleBarClick}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CategoryTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6">
                    {categoryData.map((entry, idx) => (
                      <Cell key={`cell-bar-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          )}
        </div>
      </div>

      {/* Gráfica de línea de evolución mensual */}
      <div className="glass-card w-full max-w-full min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"><Activity className="h-5 w-5" /> Evolución Mensual</h2>
        {loading ? <Skeleton height={200} /> : (
          monthlyData.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No hay datos suficientes para mostrar la evolución mensual.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220} minWidth={220}>
              <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={handleLineClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="income" stroke="#10B981" name="Ingresos" />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          )
        )}
      </div>

      {/* Top gastos e ingresos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card w-full max-w-full min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"><TrendingDown className="h-5 w-5" /> Top 5 Gastos</h2>
          {loading ? <Skeleton height={120} /> : (
            topGastos.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No hay gastos registrados para mostrar.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead><tr><th className="text-left">Descripción</th><th className="text-right">Monto</th></tr></thead>
                <tbody>
                  {topGastos.map((g, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td>{g.desc}</td>
                      <td className="text-right">${g.monto.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
        <div className="glass-card w-full max-w-full min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Top 5 Ingresos</h2>
          {loading ? <Skeleton height={120} /> : (
            topIngresos.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No hay ingresos registrados para mostrar.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead><tr><th className="text-left">Descripción</th><th className="text-right">Monto</th></tr></thead>
                <tbody>
                  {topIngresos.map((g, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td>{g.desc}</td>
                      <td className="text-right">${g.monto.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Presupuestos vs Realidad */}
      <div className="glass-card w-full max-w-full min-w-0 overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"><Target className="h-5 w-5" /> Presupuestos vs Realidad</h2>
        {loading ? <Skeleton height={120} /> : (
          budgets.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No hay presupuestos configurados para este periodo.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Categoría</th>
                  <th className="text-right">Presupuesto</th>
                  <th className="text-right">Gastado</th>
                  <th className="text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((p, idx) => {
                  const cat = categoryData.find(c => c.name === p.category) || {};
                  const gastado = cat.value || 0;
                  const diff = p.amount - gastado;
                  return (
                    <tr key={idx} className="border-b last:border-0">
                      <td>{p.category}</td>
                      <td className="text-right">${p.amount.toLocaleString()}</td>
                      <td className="text-right">${gastado.toLocaleString()}</td>
                      <td className={`text-right font-semibold ${diff < 0 ? 'text-red-600' : 'text-green-600'}`}>{diff.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Modal de detalle de transacciones */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="fixed inset-0 flex items-center justify-center z-modal bg-black/30 backdrop-blur-sm">
          <div className="glass-modal p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{modalTitle}</h3>
            {modalTransactions.length === 0 ? (
              <div className="text-gray-500">No hay transacciones para mostrar.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {modalTransactions.map((t, idx) => (
                    <tr key={idx}>
                      <td>{t.date ? t.date.slice(0,10) : ''}</td>
                      <td>{t.description}</td>
                      <td>${t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button className="btn-secondary mt-4 w-full" onClick={() => setModalOpen(false)}>Cerrar</button>
          </div>
        </div>
      </Modal>
        </>
      ) : (
        <AdvancedReports />
      )}
    </div>
  );
};

export default Reports; 