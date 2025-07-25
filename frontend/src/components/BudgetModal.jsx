import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../services/api';

const BudgetModal = ({ isOpen, onClose, categories, type, month, initialBudgets = [], onSuccess }) => {
  const [form, setForm] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Inicializar el formulario con los presupuestos existentes o vacíos
    if (categories && month) {
      setForm(
        categories.map(cat => {
          const found = initialBudgets.find(b => b.category === cat.value);
          return {
            category: cat.value,
            label: cat.label, // Usar siempre el label de la categoría
            amount: found ? found.amount : '',
            id: found ? found._id : null
          };
        })
      );
    }
  }, [categories, initialBudgets, month]);

  const handleChange = (idx, value) => {
    setForm(prev => prev.map((item, i) => i === idx ? { ...item, amount: value } : item));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Guardar solo los presupuestos que cambiaron o tienen monto válido
      const toSave = form.filter(f => f.amount !== '' && !isNaN(f.amount));
      if (toSave.length === 0) {
        setError('Debes ingresar al menos un monto válido.');
        setLoading(false);
        return;
      }
      const results = [];
      for (const f of toSave) {
        try {
          const res = await api.post('/budgets', {
            category: f.category,
            type,
            amount: parseFloat(f.amount),
            month
          });
          results.push(res.data);
        } catch (err) {
          // Si hay error individual, mostrar mensaje específico
          setError(err?.response?.data?.message || 'Error guardando presupuesto');
          setLoading(false);
          return;
        }
      }
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Error guardando presupuestos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-2 sm:px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom glass-modal text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle w-full max-w-xs sm:max-w-md md:max-w-lg">
          <div className="px-3 sm:px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Presupuestos mensuales ({type === 'expense' ? 'Gastos' : 'Ingresos'})</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            {error && <div className="mb-4 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-xs sm:text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto pr-1 sm:pr-2">
                {form.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No hay categorías disponibles para presupuestar este mes.</div>
                ) : (
                  form.map((item, idx) => (
                    <div key={item.category} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                      <label className="w-full sm:w-32 text-xs sm:text-sm text-gray-700">{item.label || item.category}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount}
                        onChange={e => handleChange(idx, e.target.value)}
                        className="input w-full sm:w-32"
                        placeholder="Monto"
                      />
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetModal; 