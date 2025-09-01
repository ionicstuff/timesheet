import React from 'react'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

const variants: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'fa-check-circle' },
  error:   { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-800',   icon: 'fa-exclamation-circle' },
  warning: { bg: 'bg-yellow-50',border: 'border-yellow-200',text: 'text-yellow-800',icon: 'fa-exclamation-triangle' },
  info:    { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-800',  icon: 'fa-info-circle' }
}

export default function Alert({ variant = 'info', children }: { variant?: AlertVariant; children: React.ReactNode }) {
  const v = variants[variant]
  return (
    <div className={[`rounded-md border ${v.border} ${v.bg} ${v.text}`, 'p-3 text-sm'].join(' ')}>
      <i className={[`fas ${v.icon}`, 'mr-2'].join(' ')} />{children}
    </div>
  )
}

