import { CheckSquare, Square, Edit, Trash2, Paperclip } from 'lucide-react';
import Button from './ui/Button';
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
  deletingId,
  handlePreviewImage,
  handleDownloadAttachment,
  downloadLoading,
  previewLoading,
  onNewTransaction
}) => {
  return (
    <div className="card">
      {loading ? (
        <div className="animate-pulse space-y-4">
          {/* Table Header Skeleton */}
          <div className="flex gap-4 pb-4 border-b border-gray-200">
            <div className="h-4 w-8 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-28 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded ml-auto"></div>
          </div>
          {/* Table Rows Skeleton */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 py-4 border-b border-gray-100">
              <div className="h-4 w-8 bg-gray-100 rounded"></div>
              <div className="h-4 w-32 bg-gray-100 rounded"></div>
              <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
              <div className="h-6 w-24 bg-gray-100 rounded-full"></div>
              <div className="h-4 w-24 bg-gray-100 rounded"></div>
              <div className="h-4 w-16 bg-gray-100 rounded"></div>
              <div className="h-5 w-5 bg-gray-100 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded ml-auto"></div>
              <div className="flex gap-2">
                <div className="h-4 w-4 bg-gray-100 rounded"></div>
                <div className="h-4 w-4 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <>
          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
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
              <tbody className="bg-white divide-y divide-gray-100">
                {transactions.map((transaction, idx) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 odd:bg-white even:bg-gray-50/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onSelectTransaction(transaction.id)}
                        className="flex items-center"
                      >
                        {selectedTransactions.includes(transaction.id) ? (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className="badge badge-gray">{getCategoryLabel(transaction.category)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      {transaction.tags && transaction.tags.length > 0
                        ? transaction.tags.map((tag, idx) => (
                            <span key={idx} className="badge badge-gray mr-1 mb-1">{tag}</span>
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
                                    ? handlePreviewImage(transaction.id, att)
                                    : handleDownloadAttachment(transaction.id, att)
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
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        title="Editar"
                        disabled={deletingId === transaction.id}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-danger-600 hover:text-danger-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar"
                        disabled={deletingId === transaction.id}
                      >
                        {deletingId === transaction.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-danger-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
              >
                {/* Header con checkbox y tipo */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => onSelectTransaction(transaction.id)}
                      className="flex-shrink-0"
                    >
                      {selectedTransactions.includes(transaction.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {transaction.description}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className={`text-right ml-3 font-bold text-base whitespace-nowrap ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>

                {/* Info secundaria */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
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
                  {transaction.attachments && transaction.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                      <Paperclip className="h-3 w-3" />
                      {transaction.attachments.length}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {transaction.tags && transaction.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {transaction.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Archivos adjuntos */}
                {transaction.attachments && transaction.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-gray-200">
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
                          className="flex items-center gap-1.5 text-xs bg-white px-2.5 py-1.5 rounded border border-gray-200 hover:bg-gray-50"
                          onClick={() =>
                            /image/.test(att.mimeType)
                              ? handlePreviewImage(transaction.id, att)
                              : handleDownloadAttachment(transaction.id, att)
                          }
                          disabled={downloadLoading === att.filename || previewLoading}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate max-w-[80px]">{att.originalName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                    disabled={deletingId === transaction.id}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    disabled={deletingId === transaction.id}
                  >
                    {deletingId === transaction.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Paperclip className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin transacciones</h3>
          <p className="text-sm text-gray-600 mb-4">Comienza creando tu primera transacción.</p>
          <Button onClick={onNewTransaction}>Nueva transacción</Button>
        </div>
      )}
    </div>
  );
};

export default TransactionTable; 
