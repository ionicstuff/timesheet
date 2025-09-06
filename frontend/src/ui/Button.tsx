import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:opacity-90',
  secondary: 'bg-slate-600 text-white hover:bg-slate-500',
  outline: 'border border-slate-500 text-foreground hover:bg-slate-700/20',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  success: 'bg-green-600 text-white hover:bg-green-500',
  ghost: 'bg-transparent text-foreground hover:bg-[var(--border-color)]'
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base'
}

export default function Button({
  variant = 'ghost',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
      )}
      {!loading && leftIcon ? <span className="mr-2">{leftIcon}</span> : null}
      <span>{children}</span>
      {!loading && rightIcon ? <span className="ml-2">{rightIcon}</span> : null}
    </button>
  )
}

