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
  breadcrumbs = [],
  children,
  gradientFrom = 'from-orange-50',
  gradientTo = 'to-red-50',
  borderColor = 'border-orange-200',
  className = '',
}) => {
  return (
    <div className={`glass-card bg-gradient-to-r ${gradientFrom}/60 ${gradientTo}/60 border ${borderColor}/70 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="mb-2 text-xs text-gray-500">
          {breadcrumbs.map((b, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1 text-gray-300">/</span>}
              {b.href ? (
                <a href={b.href} className="hover:underline text-gray-600">{b.label}</a>
              ) : (
                <span className="text-gray-700">{b.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-1 md:mb-2">{title}</h1>
          {subtitle && <p className="text-gray-600 text-sm sm:text-base md:text-lg text-balance">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto md:items-center">{actions}</div>
        )}
      </div>

      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader; 
