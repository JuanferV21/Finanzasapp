import { useState, useEffect } from 'react'
import { transactionService } from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  CheckSquare,
  Square,
  Edit3,
  Paperclip,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Info
} from 'lucide-react'
import { FaFilePdf, FaFileWord, FaFileAlt, FaFileImage, FaFileArchive, FaFile } from 'react-icons/fa';
import TransactionModal from '../components/TransactionModal'
import BulkEditModal from '../components/BulkEditModal'
import TransactionFilters from '../components/TransactionFilters'
import TransactionTable from '../components/TransactionTable'
import Pagination from '../components/Pagination'
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [selectedTransactions, setSelectedTransactions] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    search: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  // Añadir estado para previsualización de imagen
  const [previewImage, setPreviewImage] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(null); // filename que se está descargando
  const [exportingCSV, setExportingCSV] = useState(false);

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [filters, pagination.page])

  const loadCategories = async () => {
    try {
      const response = await transactionService.getCategories()
      setCategories(response.data)
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      }
      
      // Remover filtros vacíos
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })

      const response = await transactionService.getAll(params)
      setTransactions(response.data.transactions)
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }))
    } catch (error) {
      console.error('Error cargando transacciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSelectTransaction = (id) => {
    setSelectedTransactions(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactions([])
      setSelectAll(false)
    } else {
      setSelectedTransactions(transactions.map(t => t.id))
      setSelectAll(true)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedTransactions.length === 0) return
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedTransactions.length} transacción(es)?`)) {
      try {
        await Promise.all(selectedTransactions.map(id => transactionService.delete(id)))
        setSelectedTransactions([])
        setSelectAll(false)
        loadTransactions()
      } catch (error) {
        console.error('Error eliminando transacciones:', error)
        alert('Error al eliminar las transacciones')
      }
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      try {
        setDeletingId(id)
        await transactionService.delete(id)
        loadTransactions()
      } catch (error) {
        console.error('Error eliminando transacción:', error)
        alert('Error al eliminar la transacción')
      } finally {
        setDeletingId(null)
      }
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setShowTransactionModal(true)
  }

  const handleModalClose = () => {
    setShowTransactionModal(false)
    setEditingTransaction(null)
  }

  const handleModalSuccess = () => {
    handleModalClose()
    loadTransactions()
  }

  const handleBulkEditSuccess = () => {
    setShowBulkEditModal(false)
    setSelectedTransactions([])
    setSelectAll(false)
    loadTransactions()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getCategoryLabel = (category) => {
    const allCategories = [
      ...(categories.income || []),
      ...(categories.expense || [])
    ];
    const found = allCategories.find(cat => cat.value === category);
    return found ? found.label : category;
  }

  // Calcular estadísticas de transacciones actuales
  const stats = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    incomeCount: transactions.filter(t => t.type === 'income').length,
    expenseCount: transactions.filter(t => t.type === 'expense').length,
  }
  stats.balance = stats.totalIncome - stats.totalExpense

  const exportToCSV = async () => {
    try {
      setExportingCSV(true)
      // Obtener TODAS las transacciones con los filtros actuales (sin paginación)
      const params = { ...filters }

      // Remover filtros vacíos
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })

      const response = await transactionService.getAll(params)
      const allTransactions = response.data.transactions

      const headers = ['Descripción', 'Tipo', 'Categoría', 'Fecha', 'Monto', 'Notas']
      const csvContent = [
        headers.join(','),
        ...allTransactions.map(t => [
          `"${t.description}"`,
          t.type === 'income' ? 'Ingreso' : 'Gasto',
          `"${getCategoryLabel(t.category)}"`,
          format(new Date(t.date), 'dd/MM/yyyy', { locale: es }),
          t.amount,
          `"${t.notes || ''}"`
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `transacciones_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exportando CSV:', error)
      alert('Error al exportar las transacciones')
    } finally {
      setExportingCSV(false)
    }
  }

  const setDatePreset = (preset) => {
    const today = new Date()
    let startDate = ''
    let endDate = ''

    switch (preset) {
      case 'today':
        startDate = endDate = format(today, 'yyyy-MM-dd')
        break
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        startDate = format(weekStart, 'yyyy-MM-dd')
        endDate = format(today, 'yyyy-MM-dd')
        break
      case 'month':
        startDate = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd')
        endDate = format(today, 'yyyy-MM-dd')
        break
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        startDate = format(lastMonth, 'yyyy-MM-dd')
        endDate = format(new Date(today.getFullYear(), today.getMonth(), 0), 'yyyy-MM-dd')
        break
      case 'year':
        startDate = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd')
        endDate = format(today, 'yyyy-MM-dd')
        break
      default:
        return
    }

    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      search: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Función para previsualizar imagen autenticada
  const handlePreviewImage = async (transactionId, att) => {
    setPreviewLoading(true);
    try {
      const res = await transactionService.downloadAttachment(transactionId, att.filename);
      const url = URL.createObjectURL(res.data);
      setPreviewImage(url);
    } catch (err) {
      alert('No se pudo cargar la imagen.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Función para descargar archivo autenticado
  const handleDownloadAttachment = async (transactionId, att) => {
    setDownloadLoading(att.filename);
    try {
      const res = await transactionService.downloadAttachment(transactionId, att.filename);
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = att.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('No se pudo descargar el archivo.');
    } finally {
      setDownloadLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transacciones"
        subtitle="Gestiona tus ingresos y gastos de manera eficiente"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={exportToCSV}
              className="w-full sm:w-auto justify-center"
              leftIcon={Download}
              disabled={exportingCSV}
            >
              {exportingCSV ? 'Exportando...' : 'Exportar CSV'}
            </Button>
            <Button onClick={() => setShowTransactionModal(true)} className="w-full sm:w-auto justify-center" leftIcon={Plus}>
              Nueva transacción
            </Button>
          </>
        }
        gradientFrom="from-green-50"
        gradientTo="to-blue-50"
        borderColor="border-green-200"
      />

      {/* Filtros y búsqueda */}
      <div className="glass-card w-full max-w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filtros y búsqueda</h2>
        </div>
        <TransactionFilters
          filters={filters}
          categories={categories}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          onDatePreset={setDatePreset}
        />
      </div>

      {/* Tarjetas de resumen */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card bg-gradient-to-br from-green-50/80 to-emerald-100/80 border-green-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalIncome)}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.incomeCount} transacciones</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-red-50/80 to-rose-100/80 border-red-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Gastos</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(stats.totalExpense)}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.expenseCount} transacciones</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className={`glass-card bg-gradient-to-br ${stats.balance >= 0 ? 'from-blue-50/80 to-indigo-100/80 border-blue-200/60' : 'from-orange-50/80 to-amber-100/80 border-orange-200/60'} hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Balance</p>
                <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(stats.balance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{pagination.total} total</p>
              </div>
              <div className={`h-12 w-12 ${stats.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'} rounded-full flex items-center justify-center`}>
                <DollarSign className={`h-6 w-6 ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de transacciones */}
      <div className="glass-card w-full max-w-full min-w-0 overflow-x-auto">
        <div className="text-sm text-gray-600 mb-2">Mostrando {transactions.length} de {pagination.total} transacciones</div>
        <TransactionTable
          transactions={transactions}
          loading={loading}
          selectedTransactions={selectedTransactions}
          selectAll={selectAll}
          onSelectAll={handleSelectAll}
          onSelectTransaction={handleSelectTransaction}
          getCategoryLabel={getCategoryLabel}
          formatCurrency={formatCurrency}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          deletingId={deletingId}
          handlePreviewImage={handlePreviewImage}
          handleDownloadAttachment={handleDownloadAttachment}
          downloadLoading={downloadLoading}
          previewLoading={previewLoading}
          onNewTransaction={() => setShowTransactionModal(true)}
        />
      </div>

      {/* Barra de acciones masivas flotante */}
      {selectedTransactions.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="glass-card shadow-2xl border-2 border-primary-200 px-6 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-gray-900">
                {selectedTransactions.length} seleccionada{selectedTransactions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulkEditModal(true)}
                leftIcon={Edit3}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteSelected}
                leftIcon={Trash2}
              >
                Eliminar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTransactions([])
                  setSelectAll(false)
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Pagination
          pagination={pagination}
          setPagination={setPagination}
        />
      </div>

      {/* Modal de transacción */}
      {showTransactionModal && (
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          transaction={editingTransaction}
        />
      )}

      {/* Modal de edición masiva */}
      {showBulkEditModal && (
        <BulkEditModal
          isOpen={showBulkEditModal}
          onClose={() => setShowBulkEditModal(false)}
          onSuccess={handleBulkEditSuccess}
          selectedTransactions={selectedTransactions}
          categories={categories}
        />
      )}

      {/* Modal de previsualización de imagen mejorado */}
      {previewImage && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm" onClick={() => { URL.revokeObjectURL(previewImage); setPreviewImage(null); }}>
          <div className="relative max-h-[90vh] max-w-[95vw]">
            <img
              src={previewImage}
              alt="Vista previa"
              className="max-h-full max-w-full rounded-lg shadow-2xl border-4 border-white cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => { URL.revokeObjectURL(previewImage); setPreviewImage(null); }}
              className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors duration-200"
              title="Cerrar vista previa"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions 
