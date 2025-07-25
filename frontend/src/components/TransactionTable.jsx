import { CheckSquare, Square, Edit, Trash2, Paperclip } from 'lucide-react';
import { FaFilePdf, FaFileWord, FaFileAlt, FaFileImage, FaFileArchive, FaFile } from 'react-icons/fa';

const TransactionTable = ({
  transactions,
  loading,
  selectedTransactions,
  selectAll,
  onSelectAll,
  onSelectTransaction,
  getCategoryLabel,
  formatCurrency,
  handleEdit,
  handleDelete,
  handlePreviewImage,
  handleDownloadAttachment,
  downloadLoading,
  previewLoading,
  setPreviewImage,
  previewImage
}) => {
  return (
    <div className="card">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : transactions.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={onSelectAll}
                      className="flex items-center"
                    >
                      {selectAll ? (
                        <CheckSquare className="h-4 w-4 text-primary-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archivos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onSelectTransaction(transaction._id)}
                        className="flex items-center"
                      >
                        {selectedTransactions.includes(transaction._id) ? (
                          <CheckSquare className="h-4 w-4 text-primary-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-danger-100 text-danger-800'
                      }`}>
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCategoryLabel(transaction.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {transaction.tags && transaction.tags.length > 0
                        ? transaction.tags.map((tag, idx) => (
                            <span key={idx} className="inline-block bg-gray-100 rounded px-2 py-0.5 mr-1 mb-1">
                              {tag}
                            </span>
                          ))
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {transaction.attachments && transaction.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {transaction.attachments.map((att, idx) => {
                            let Icon = FaFile;
                            if (/pdf/.test(att.mimeType)) Icon = FaFilePdf;
                            else if (/word|doc/.test(att.mimeType)) Icon = FaFileWord;
                            else if (/image/.test(att.mimeType)) Icon = FaFileImage;
                            else if (/text/.test(att.mimeType)) Icon = FaFileAlt;
                            else if (/zip|rar|archive/.test(att.mimeType)) Icon = FaFileArchive;
                            return (
                              <button
                                key={idx}
                                title={att.originalName}
                                className="text-gray-500 hover:text-primary-600"
                                onClick={() =>
                                  /image/.test(att.mimeType)
                                    ? handlePreviewImage(transaction._id, att)
                                    : handleDownloadAttachment(transaction._id, att)
                                }
                                disabled={downloadLoading === att.filename || previewLoading}
                              >
                                <Icon className="inline h-5 w-5" />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-primary-600 hover:text-primary-900 mr-2"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction._id)}
                        className="text-danger-600 hover:text-danger-900"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Modal de previsualización de imagen */}
          {previewImage && (
            <div className="fixed inset-0 z-modal flex items-center justify-center bg-black bg-opacity-70">
              <div className="bg-white rounded-lg shadow-lg p-4 relative max-w-lg w-full">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setPreviewImage(null)}
                >
                  &times;
                </button>
                <img src={previewImage} alt="Preview" className="max-w-full max-h-[70vh] mx-auto" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-12">No hay transacciones para mostrar.</div>
      )}
    </div>
  );
};

export default TransactionTable; 