import { Filter, Search } from 'lucide-react';

const TransactionFilters = ({
  filters,
  categories,
  onFilterChange,
  onClearFilters,
  onDatePreset
}) => {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
        {/* Búsqueda */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="input pl-10"
              placeholder="Buscar por descripción..."
            />
          </div>
        </div>
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="select"
          >
            <option value="">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
        </div>
        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="select"
          >
            <option value="">Todas</option>
            {Object.entries(categories).map(([type, cats]) => (
              <optgroup key={type} label={type === 'income' ? 'Ingresos' : 'Gastos'}>
                {cats.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {/* Monto mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto mínimo
          </label>
          <input
            type="number"
            value={filters.minAmount}
            onChange={(e) => onFilterChange('minAmount', e.target.value)}
            className="input"
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
        {/* Monto máximo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto máximo
          </label>
          <input
            type="number"
            value={filters.maxAmount}
            onChange={(e) => onFilterChange('maxAmount', e.target.value)}
            className="input"
            placeholder="999999"
            min="0"
            step="0.01"
          />
        </div>
      </div>
      {/* Filtros de fecha */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rango de fechas
        </label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Presets rápidos */}
          <div className="flex gap-2">
            <button
              onClick={() => onDatePreset('today')}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Hoy
            </button>
            <button
              onClick={() => onDatePreset('week')}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Esta semana
            </button>
            <button
              onClick={() => onDatePreset('month')}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Este mes
            </button>
            <button
              onClick={() => onDatePreset('lastMonth')}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Mes pasado
            </button>
            <button
              onClick={() => onDatePreset('year')}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Este año
            </button>
          </div>
          {/* Fecha inicio */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="input text-sm"
            />
          </div>
          {/* Fecha fin */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="input text-sm"
            />
          </div>
        </div>
      </div>
      {/* Botón limpiar filtros */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
};

export default TransactionFilters; 