import clsx from 'clsx'

export default function Card({ children, className, hover = true, ...props }) {
  return (
    <div className={clsx('card', hover && 'card-hover', className)} {...props}>
      {children}
    </div>
  )
}

