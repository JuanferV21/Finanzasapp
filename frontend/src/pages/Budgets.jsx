import React, { useState, useEffect, useRef } from 'react';
import { budgetService, statsService } from '../services/api';
import BudgetModal from '../components/BudgetModal';
import PageHeader from '../components/PageHeader';
import { 
  Trash2, 
  Edit, 
  Plus, 
  Calendar,
  Download,
  FileText,
  Target,
  TrendingDown,
  DollarSign,
  BarChart3,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Budgets = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('expense'); // 'expense' o 'income'
  const [spentByCategory, setSpentByCategory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState(null);
  const tableRef = useRef(null);

  // Categorías estándar de gastos (fallback)
  const defaultExpenseCategories = [
    { value: 'food', label: 'Alimentación' },
    { value: 'transport', label: 'Transporte' },
    { value: 'entertainment', label: 'Entretenimiento' },
    { value: 'shopping', label: 'Compras' },
    { value: 'health', label: 'Salud' },
    { value: 'education', label: 'Educación' },
    { value: 'housing', label: 'Vivienda' },
    { value: 'utilities', label: 'Servicios' },
    { value: 'insurance', label: 'Seguros' },
    { value: 'other_expense', label: 'Otros Gastos' },
  ];

  // Cargar presupuestos, categorías y gasto real por categoría
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Cargar presupuestos del mes
        const res = await budgetService.getAll({ month: selectedMonth });
        const fetchedBudgets = res.data || [];
        const normalizedBudgets = fetchedBudgets.map(budget => {
          const rawAmount = typeof budget.amount === 'number' ? budget.amount : parseFloat(budget.amount);
          const numericAmount = Number.isFinite(rawAmount) ? rawAmount : 0;
          return { ...budget, amount: numericAmount };
        });
        setBudgets(normalizedBudgets);
        // Cargar categorías de gastos
        const catRes = await statsService.getCategories({ type: 'expense' });
        let cats = catRes.data.expense?.categories || [];
        // Si la API no devuelve label/value, usar las estándar
        if (!cats.length || !cats[0].label) {
          cats = defaultExpenseCategories;
        }
        setCategories(cats);
        // Cargar gasto real por categoría para el mes
        const [year, month] = selectedMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(year, parseInt(month), 0); // último día del mes
        const statsRes = await statsService.getCategories({ type: 'expense', startDate, endDate: endDate.toISOString().slice(0,10) });
        const expenseStats = statsRes.data.expense?.categories || [];
        const normalizedSpent = expenseStats.map(category => {
          const rawValue = typeof category.value === 'number' ? category.value : parseFloat(category.value);
          const numericValue = Number.isFinite(rawValue) ? rawValue : 0;
          return { ...category, value: numericValue };
        });
        setSpentByCategory(normalizedSpent);
      } catch (err) {
        setError('Error cargando presupuestos o categorías');
        setBudgets([]);
        setCategories(defaultExpenseCategories);
        setSpentByCategory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, showModal]);

  // Resumen
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

  // Eliminar presupuesto
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    try {
      setLoading(true);
      await budgetService.delete(id);
      setBudgets(budgets.filter(b => b.id !== id));
    } catch (err) {
      setError('Error eliminando presupuesto');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar modal para agregar/editar
  const handleAdd = () => {
    setModalType('expense'); // Solo gastos por ahora
    setShowModal(true);
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    let csv = 'Categoría,Presupuesto,Gastado,Diferencia,Porcentaje\n';
    budgets.forEach(b => {
      const cat = categories.find(c => c.value === b.category);
      const rawSpent = spentByCategory.find(s => s.name === (cat ? cat.label : b.category))?.value ?? 0;
      const spent = typeof rawSpent === 'number' ? rawSpent : parseFloat(rawSpent) || 0;
      const amount = b.amount;
      const diff = amount - spent;
      const percent = amount > 0 ? Math.round((spent / amount) * 100) : 0;
      csv += `${cat ? cat.label : b.category},${amount},${spent},${diff},${percent}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `presupuestos_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar a PDF
  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.text(`Presupuestos ${selectedMonth}`, 30, 30);
    pdf.addImage(imgData, 'PNG', 20, 50, imgWidth, imgHeight);
    pdf.save(`presupuestos_${selectedMonth}.pdf`);
  };

  // Guardar edición rápida
  const handleQuickSave = async (budget) => {
    if (!editValue || isNaN(editValue) || Number(editValue) < 0) {
      alert('El monto debe ser un número positivo');
      return;
    }
    setSavingId(budget.id);
    try {
      await budgetService.update(budget.id, {
        amount: parseFloat(editValue)
      });
      // Actualizar el presupuesto en el estado local
      setBudgets(budgets.map(b =>
        b.id === budget.id
          ? { ...b, amount: parseFloat(editValue) }
          : b
      ));
      setEditingId(null);
      setEditValue('');
    } catch (err) {
      alert('Error al guardar el presupuesto');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header mejorado unificado */}
      <PageHeader
        title="Presupuestos"
        subtitle="Planifica y controla tus gastos mensuales por categoría"
        actions={
          <>
            <button 
              className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center hover:shadow-md transition-all duration-200"
              onClick={handleExportCSV}
              title="Exportar presupuestos a CSV"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button 
              className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center hover:shadow-md transition-all duration-200"
              onClick={handleExportPDF}
              title="Exportar presupuestos a PDF"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
            <button 
              className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center hover:shadow-lg transition-all duration-200"
              onClick={handleAdd}
              title="Agregar nuevo presupuesto"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </>
        }
      >
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-orange-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total presupuestado</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${totalBudget.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total gastado</p>
                <p className="text-2xl font-bold text-green-600">
                  ${spentByCategory.reduce((sum, cat) => sum + cat.value, 0).toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Restante</p>
                <p className={`text-2xl font-bold ${
                  totalBudget - spentByCategory.reduce((sum, cat) => sum + cat.value, 0) >= 0 
                    ? 'text-blue-600' 
                    : 'text-red-600'
                }`}>
                  ${(totalBudget - spentByCategory.reduce((sum, cat) => sum + cat.value, 0)).toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categorías</p>
                <p className="text-2xl font-bold text-purple-600">
                  {budgets.length}
                </p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </PageHeader>

      {/* Controles mejorados */}
      <div className="glass-card hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Seleccionar período</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>Gestiona presupuestos por mes</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Mes:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="input border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2">
            <button 
              className="btn-secondary text-sm px-3 py-1 hover:shadow-md transition-all duration-200"
              onClick={() => {
                const now = new Date();
                setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
              }}
              title="Ir al mes actual"
            >
              Mes actual
            </button>
            <button 
              className="btn-secondary text-sm px-3 py-1 hover:shadow-md transition-all duration-200"
              onClick={() => {
                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                setSelectedMonth(`${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`);
              }}
              title="Ir al mes anterior"
            >
              Mes anterior
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de presupuestos mejorada */}
      <div className="glass-card hover:shadow-lg transition-all duration-300" ref={tableRef}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Presupuestos por categoría</h3>
            <p className="text-sm text-gray-600">
              {budgets.length > 0 
                ? `${budgets.length} categoría(s) con presupuesto asignado`
                : 'No hay presupuestos configurados para este mes'
              }
            </p>
          </div>
          {budgets.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Haz clic en "Editar" para modificar montos
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando presupuestos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-sm text-gray-500">Intenta recargar la página</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-500 mb-2">No hay presupuestos para este mes</p>
            <p className="text-sm text-gray-400 mb-4">Comienza agregando tu primer presupuesto</p>
            <button 
              className="btn-primary"
              onClick={handleAdd}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar presupuesto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presupuesto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gastado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.map((b, idx) => {
                  const cat = categories.find(c => c.value === b.category);
                  const rawSpent = spentByCategory.find(s => s.name === (cat ? cat.label : b.category))?.value ?? 0;
                  const spent = typeof rawSpent === 'number' ? rawSpent : parseFloat(rawSpent) || 0;
                  const amount = b.amount;
                  const diff = amount - spent;
                  const percent = amount > 0 ? Math.round((spent / amount) * 100) : 0;
                  const isExceeded = spent > amount;
                  const isNearLimit = percent >= 80 && percent < 100;
                  
                  return (
                    <tr key={b.id || idx} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <Target className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{cat ? cat.label : b.category}</div>
                            <div className="text-xs text-gray-500">Categoría de gastos</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === b.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="input w-24 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              autoFocus
                            />
                            <button
                              className="btn-primary btn-xs hover:shadow-md transition-all duration-200"
                              onClick={() => handleQuickSave(b)}
                              disabled={savingId === b.id}
                              title="Guardar cambios"
                            >
                              {savingId === b.id ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button 
                              className="btn-secondary btn-xs hover:shadow-md transition-all duration-200" 
                              onClick={() => setEditingId(null)}
                              title="Cancelar edición"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <span className="text-sm font-semibold text-gray-900">${amount.toLocaleString()}</span>
                            <button 
                              className="btn-secondary btn-xs hover:shadow-md transition-all duration-200" 
                              onClick={() => { setEditingId(b.id); setEditValue(String(amount)); }}
                              title="Editar presupuesto"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">${spent.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${
                              isExceeded ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {diff < 0 ? '-' : '+'}${Math.abs(diff).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-1">
                              {isExceeded && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Excedido
                                </span>
                              )}
                              {isNearLimit && !isExceeded && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Cerca del límite
                                </span>
                              )}
                              {!isExceeded && !isNearLimit && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  OK
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Barra de progreso mejorada */}
                          <div className="w-full bg-gray-200 rounded-full h-3 relative group">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ease-out ${
                                isExceeded ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                                isNearLimit ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                                'bg-gradient-to-r from-green-500 to-green-600'
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            ></div>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-10 hidden group-hover:block bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2 text-xs text-gray-700 whitespace-nowrap">
                              <div className="font-semibold mb-1">Progreso del presupuesto</div>
                              <div>Gastado: ${spent.toLocaleString()}</div>
                              <div>Presupuesto: ${amount.toLocaleString()}</div>
                              <div className="font-semibold">{percent}% utilizado</div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 text-right">{percent}% utilizado</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          className="btn-danger hover:shadow-md transition-all duration-200" 
                          onClick={() => handleDelete(b.id)}
                          title="Eliminar presupuesto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar/editar presupuestos */}
      {showModal && (
        <BudgetModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          categories={categories}
          type={modalType}
          month={selectedMonth}
          initialBudgets={budgets}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Budgets; 
