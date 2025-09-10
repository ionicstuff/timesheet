import React from 'react'

function cx(...cls: (string | undefined | false)[]) {
  return cls.filter(Boolean).join(' ')
}

interface CardProps {
  title?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
  titleClassName?: string
}

export default function Card({ title, actions, children, className = '', titleClassName = '' }: CardProps) {
  return (
    <div className={cx('w-full rounded-lg border border-border bg-card text-card-foreground shadow-sm', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className={cx('font-semibold', titleClassName || 'text-sm')}>{title}</h3>
          {actions}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

// shadcn-compatible subcomponents (for exact UI cloning)
export const CardHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx('flex flex-col space-y-1.5 p-6', className)} {...props}>{children}</div>
)
export const CardTitle = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cx('text-2xl font-semibold leading-none tracking-tight', className)} {...props}>{children}</h3>
)
export const CardDescription = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cx('text-sm text-muted-foreground', className)} {...props}>{children}</p>
)
export const CardContent = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx('p-6 pt-0', className)} {...props}>{children}</div>
)
export const CardFooter = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx('flex items-center p-6 pt-0', className)} {...props}>{children}</div>
)

