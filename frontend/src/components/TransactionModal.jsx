import { useState, useEffect } from 'react'
import { transactionService } from '../services/api'
import { X, Calendar, Paperclip } from 'lucide-react'
import FileUpload from './FileUpload'
import { FaFilePdf, FaFileWord, FaFileAlt, FaFileImage, FaFileArchive, FaFile } from 'react-icons/fa';

const TransactionModal = ({ isOpen, onClose, onSuccess, transaction = null }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tags: []
  })
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAttachments, setShowAttachments] = useState(false)
  const [previewImage, setPreviewImage] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(null);

  const isEditing = !!transaction

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      if (transaction) {
        setFormData({
          type: transaction.type,
          amount: transaction.amount.toString(),
          category: transaction.category,
          description: transaction.description,
          date: new Date(transaction.date).toISOString().split('T')[0],
          tags: transaction.tags || []
        })
      } else {
        setFormData({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          tags: []
        })
      }
    }
  }, [isOpen, transaction])

  const loadCategories = async () => {
    try {
      const response = await transactionService.getCategories()
      setCategories(response.data)
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Si cambia el tipo, resetear categoría
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value,
        category: ''
      }))
    }
    
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      if (isEditing) {
        await transactionService.update(transaction._id, data)
      } else {
        await transactionService.create(data)
      }

      onSuccess()
    } catch (error) {
      console.error('Error guardando transacción:', error)
      setError(error.response?.data?.message || 'Error al guardar la transacción')
    } finally {
      setLoading(false)
    }
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

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Overlay */}
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
          {/* Modal */}
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de transacción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={formData.type === 'expense'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Gasto</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={formData.type === 'income'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Ingreso</span>
                    </label>
                  </div>
                </div>

                {/* Monto */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Monto
                  </label>
                  <div className="mt-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.amount}
                      onChange={handleChange}
                      className="input pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Categoría
                  </label>
                  <select
                    name="category"
                    id="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="select mt-1"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories[formData.type]?.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <input
                    type="text"
                    name="description"
                    id="description"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    className="input mt-1"
                    placeholder="Descripción de la transacción"
                    maxLength={200}
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Fecha
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      className="input pl-10"
                    />
                  </div>
                </div>

                {/* Archivos adjuntos (solo para edición) */}
                {isEditing && transaction._id ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAttachments(!showAttachments)}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800"
                    >
                      <Paperclip className="h-4 w-4" />
                      {showAttachments ? 'Ocultar archivos' : 'Gestionar archivos adjuntos'}
                      {transaction.attachments && transaction.attachments.length > 0 && (
                        <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                          {transaction.attachments.length}
                        </span>
                      )}
                    </button>
                    
                    {showAttachments && transaction.attachments && transaction.attachments.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-4">
                        {transaction.attachments.map((att, idx) => {
                          const isImage = att.mimeType.startsWith('image/');
                          const isPdf = att.mimeType === 'application/pdf';
                          const isWord = att.mimeType.includes('word') || att.mimeType.includes('officedocument');
                          const isText = att.mimeType.startsWith('text/');
                          const isArchive = att.mimeType.includes('zip') || att.mimeType.includes('rar');
                          return (
                            <div key={idx} className="flex flex-col items-center w-20">
                              {isImage ? (
                                <button
                                  onClick={() => handlePreviewImage(transaction._id, att)}
                                  className="focus:outline-none"
                                  title={att.originalName}
                                  disabled={previewLoading}
                                >
                                  {previewLoading ? (
                                    <span className="w-12 h-12 flex items-center justify-center"><span className="loader"></span></span>
                                  ) : (
                                    <img src={att.url} alt={att.originalName} className="w-12 h-12 object-cover rounded border" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDownloadAttachment(transaction._id, att)}
                                  title={att.originalName}
                                  className="flex items-center justify-center"
                                  disabled={downloadLoading === att.filename}
                                >
                                  {downloadLoading === att.filename ? (
                                    <span className="w-10 h-10 flex items-center justify-center"><span className="loader"></span></span>
                                  ) : isPdf ? (
                                    <FaFilePdf className="text-red-600 w-10 h-10" />
                                  ) : isWord ? (
                                    <FaFileWord className="text-blue-600 w-10 h-10" />
                                  ) : isText ? (
                                    <FaFileAlt className="text-gray-600 w-10 h-10" />
                                  ) : isArchive ? (
                                    <FaFileArchive className="text-yellow-600 w-10 h-10" />
                                  ) : (
                                    <FaFile className="text-gray-500 w-10 h-10" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleDownloadAttachment(transaction._id, att)}
                                className="text-xs text-primary-600 truncate max-w-[70px]"
                                title={att.originalName}
                                disabled={downloadLoading === att.filename}
                              >
                                {downloadLoading === att.filename ? 'Descargando...' : (att.originalName.length > 12 ? att.originalName.slice(0, 12) + '…' : att.originalName)}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : isEditing && !transaction._id ? (
                  <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    Debes guardar la transacción antes de poder adjuntar archivos.
                  </div>
                ) : null}

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      isEditing ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de previsualización de imagen */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => { URL.revokeObjectURL(previewImage); setPreviewImage(null); }}>
          <img
            src={previewImage}
            alt="Vista previa"
            className="max-h-[80vh] max-w-[90vw] rounded shadow-lg border-4 border-white cursor-pointer"
            onClick={() => { URL.revokeObjectURL(previewImage); setPreviewImage(null); }}
          />
        </div>
      )}
    </>
  )
}

export default TransactionModal 