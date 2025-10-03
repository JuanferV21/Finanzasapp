import { Filter, Search } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

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
          <Input
            label="Buscar"
            placeholder="Buscar por descripción..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className=""
          />
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
          <Input
            label="Monto mínimo"
            type="number"
            value={filters.minAmount}
            onChange={(e) => onFilterChange('minAmount', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
        {/* Monto máximo */}
        <div>
          <Input
            label="Monto máximo"
            type="number"
            value={filters.maxAmount}
            onChange={(e) => onFilterChange('maxAmount', e.target.value)}
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
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => onDatePreset('today')}>Hoy</Button>
            <Button variant="ghost" size="sm" onClick={() => onDatePreset('week')}>Esta semana</Button>
            <Button variant="ghost" size="sm" onClick={() => onDatePreset('month')}>Este mes</Button>
            <Button variant="ghost" size="sm" onClick={() => onDatePreset('lastMonth')}>Mes pasado</Button>
            <Button variant="ghost" size="sm" onClick={() => onDatePreset('year')}>Este año</Button>
          </div>
          {/* Fecha inicio */}
          <div>
            <Input
              label="Desde"
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="text-sm"
            />
          </div>
          {/* Fecha fin */}
          <div>
            <Input
              label="Hasta"
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </div>
      {/* Botón limpiar filtros */}
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onClearFilters}>
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
};

export default TransactionFilters; 
