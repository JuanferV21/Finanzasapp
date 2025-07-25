import React from 'react';
import { X } from 'lucide-react';

/**
 * ModalHeader: Encabezado reutilizable para modales principales.
 * Props:
 * - title: string (título principal, requerido)
 * - icon: ReactNode (ícono opcional a la izquierda del título)
 * - onClose: función para cerrar el modal (requerido)
 * - className: string (clases extra, opcional)
 *
 * Ejemplo de uso:
 * <ModalHeader
 *   title="Agregar transacción"
 *   icon={<DollarSign className="h-6 w-6 text-primary-600" />}
 *   onClose={handleClose}
 * />
 */
const ModalHeader = ({ title, icon, onClose, className = '' }) => {
  return (
    <div className={`relative flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-200 ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex-1">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1"
        aria-label="Cerrar modal"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ModalHeader; 