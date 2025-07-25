import React from 'react';

/**
 * Componente de encabezado/banner reutilizable para páginas principales.
 *
 * Ejemplo de uso:
 * <PageHeader
 *   title="Presupuestos"
 *   subtitle="Planifica y controla tus gastos mensuales por categoría"
 *   actions={
 *     <>
 *       <button>Acción 1</button>
 *       <button>Acción 2</button>
 *     </>
 *   }
 *   gradientFrom="from-orange-50"
 *   gradientTo="to-red-50"
 *   borderColor="border-orange-200"
 * >
 *   <div>Contenido opcional (tarjetas de resumen, etc.)</div>
 * </PageHeader>
 *
 * Props:
 * - title: string (título principal, requerido)
 * - subtitle: string (subtítulo, opcional)
 * - actions: ReactNode (botones de acción, opcional)
 * - children: ReactNode (tarjetas de resumen u otros elementos opcionales)
 * - gradientFrom, gradientTo, borderColor: clases Tailwind para personalizar colores (opcionales)
 * - className: string (clases extra para el contenedor, opcional)
 *
 * Recomendaciones:
 * - Usar en todas las páginas principales para mantener coherencia visual.
 * - Personalizar colores según la sección para mejor UX.
 * - Para modales, usar un header más simple (no PageHeader completo).
 */
const PageHeader = ({
  title,
  subtitle,
  actions,
  children,
  gradientFrom = 'from-orange-50',
  gradientTo = 'to-red-50',
  borderColor = 'border-orange-200',
  className = '',
}) => {
  return (
    <div className={`glass-card bg-gradient-to-r ${gradientFrom}/50 ${gradientTo}/50 border ${borderColor}/50 ${className}`}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{title}</h1>
          {subtitle && <p className="text-gray-600 text-sm sm:text-base md:text-lg">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto md:items-center">{actions}</div>
        )}
      </div>
      {children && (
        <div className="mt-2">{children}</div>
      )}
    </div>
  );
};

export default PageHeader; 