import clsx from 'clsx'

export default function Input({ label, hint, error, className, id, ...props }) {
  const inputId = id || props.name
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input id={inputId} className={clsx('input', error && 'border-danger-300 focus:ring-danger-500')} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  )}

