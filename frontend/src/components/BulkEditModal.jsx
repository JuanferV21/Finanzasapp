import { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'

const BulkEditModal = ({ isOpen, onClose, onSuccess, selectedTransactions, categories }) => {
  const [formData, setFormData] = useState({
    type: '',
    category: '',
    tags: '',
    action: 'update' // 'update' o 'add_tags'
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: '',
        category: '',
        tags: '',
        action: 'update'
      })
      setErrors({})
    }
  }, [isOpen])

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (formData.action === 'update') {
      if (!formData.type) {
        newErrors.type = 'El tipo es requerido'
      }
      if (!formData.category) {
        newErrors.category = 'La categoría es requerida'
      }
    }

    if (formData.action === 'add_tags' && !formData.tags.trim()) {
      newErrors.tags = 'Los tags son requeridos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/transactions/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          transactionIds: selectedTransactions,
          ...formData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al actualizar transacciones')
      }

      onSuccess()
    } catch (error) {
      console.error('Error en edición masiva:', error)
      alert(error.message || 'Error al actualizar las transacciones')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-modal">
      <div className="glass-modal max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edición Masiva
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Editando {selectedTransactions.length} transacción(es)
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Los cambios se aplicarán a todas las transacciones seleccionadas.
                </p>
              </div>
            </div>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de acción
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="action"
                  value="update"
                  checked={formData.action === 'update'}
                  onChange={(e) => handleInputChange('action', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Actualizar tipo y categoría</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="action"
                  value="add_tags"
                  checked={formData.action === 'add_tags'}
                  onChange={(e) => handleInputChange('action', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Agregar tags</span>
              </label>
            </div>
          </div>

          {/* Type and Category (only for update action) */}
          {formData.action === 'update' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="select"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
                {errors.type && (
                  <p className="text-sm text-danger-600 mt-1">{errors.type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="select"
                  disabled={!formData.type}
                >
                  <option value="">Seleccionar categoría</option>
                  {formData.type && categories[formData.type] && (
                    categories[formData.type].map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))
                  )}
                </select>
                {errors.category && (
                  <p className="text-sm text-danger-600 mt-1">{errors.category}</p>
                )}
              </div>
            </>
          )}

          {/* Tags (only for add_tags action) */}
          {formData.action === 'add_tags' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags a agregar *
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="input"
                placeholder="Ej: trabajo, importante, personal (separados por comas)"
              />
              {errors.tags && (
                <p className="text-sm text-danger-600 mt-1">{errors.tags}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Los tags se agregarán a las transacciones existentes, no los reemplazarán.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BulkEditModal 