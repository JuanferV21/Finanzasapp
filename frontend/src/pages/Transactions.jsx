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

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [selectedTransactions, setSelectedTransactions] = useState([])
  const [selectAll, setSelectAll] = useState(false)
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
      setSelectedTransactions(transactions.map(t => t._id))
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
        await transactionService.delete(id)
        loadTransactions()
      } catch (error) {
        console.error('Error eliminando transacción:', error)
        alert('Error al eliminar la transacción')
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

  const exportToCSV = () => {
    const headers = ['Descripción', 'Tipo', 'Categoría', 'Fecha', 'Monto', 'Notas']
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Transacciones</h1>
          <p className="text-gray-600 text-sm sm:text-base">Gestiona tus ingresos y gastos de manera eficiente</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center" onClick={exportToCSV}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <button className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center" onClick={() => setShowTransactionModal(true)}>
            <Plus className="h-4 w-4" />
            Nueva transacción
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card w-full max-w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filtros y búsqueda</h2>
          <button className="text-primary-600 text-sm font-medium hover:underline" onClick={clearFilters}>Limpiar filtros</button>
        </div>
        <TransactionFilters
          filters={filters}
          categories={categories}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          onDatePreset={setDatePreset}
        />
      </div>

      {/* Lista de transacciones */}
      <div className="card w-full max-w-full min-w-0 overflow-x-auto">
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
          handlePreviewImage={handlePreviewImage}
          handleDownloadAttachment={handleDownloadAttachment}
          downloadLoading={downloadLoading}
          previewLoading={previewLoading}
          setPreviewImage={setPreviewImage}
          previewImage={previewImage}
        />
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          onPageChange={p => setPagination(prev => ({ ...prev, page: p }))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm" onClick={() => { URL.revokeObjectURL(previewImage); setPreviewImage(null); }}>
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