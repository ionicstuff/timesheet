import React from 'react'

interface CardProps {
  title?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export default function Card({ title, actions, children, className = '' }: CardProps) {
  return (
    <div className={[
      'rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)]',
      'shadow-[0_4px_14px_rgba(0,0,0,0.12)]',
      className
    ].join(' ')}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          {actions}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

