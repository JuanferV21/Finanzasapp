import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ pagination, setPagination }) => {
  if (pagination.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-700">
        Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
        {pagination.total} resultados
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          disabled={pagination.page === 1}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-3 py-2 text-sm text-gray-700">
          Página {pagination.page} de {pagination.pages}
        </span>
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          disabled={pagination.page === pagination.pages}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination; 