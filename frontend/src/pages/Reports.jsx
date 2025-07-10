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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'];

const Reports = () => {
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

        // 5. Presupuestos vs realidad (solo mes actual)
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 text-sm sm:text-base">Visualiza y exporta tus reportes financieros</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <button className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center" onClick={handleExportPDF}>
            <FileText className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Gráficas y tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="card w-full max-w-full min-w-0">
          {/* Gráfica o tabla 1 */}
        </div>
        <div className="card w-full max-w-full min-w-0 overflow-x-auto">
          {/* Gráfica o tabla 2, con scroll horizontal si es necesario */}
        </div>
      </div>

      {/* Más secciones de reportes, todas con clases responsive y scroll horizontal en tablas */}
    </div>
  );
};

export default Reports; 