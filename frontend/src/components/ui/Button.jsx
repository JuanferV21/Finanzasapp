import clsx from 'clsx'

const base = 'btn'
const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'btn-success',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
}
const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  as: Component = 'button',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}) {
  return (
    <Component
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {LeftIcon ? <LeftIcon className="h-4 w-4" /> : null}
      {children}
      {RightIcon ? <RightIcon className="h-4 w-4" /> : null}
    </Component>
  )
}

