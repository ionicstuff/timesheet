import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label ? (
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {leftIcon ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            {leftIcon}
          </div>
        ) : null}
        <input
          className={[
            'w-full rounded-md border bg-background text-foreground',
            'border-[var(--border-color)] placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            leftIcon ? 'pl-10' : 'pl-3',
            rightIcon ? 'pr-10' : 'pr-3',
            'h-10 text-sm',
            className
          ].join(' ')}
          {...props}
        />
        {rightIcon ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            {rightIcon}
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : null}
    </div>
  )
}

