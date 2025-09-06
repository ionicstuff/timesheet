import React from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

type VariantStyle = { bg: string; border: string; text: string; Icon: React.ElementType }

const variants: Record<AlertVariant, VariantStyle> = {
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', Icon: CheckCircle },
  error:   { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-800',   Icon: AlertCircle },
  warning: { bg: 'bg-yellow-50',border: 'border-yellow-200',text: 'text-yellow-800',Icon: AlertTriangle },
  info:    { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-800',  Icon: Info }
}

export default function Alert({ variant = 'info', children }: { variant?: AlertVariant; children: React.ReactNode }) {
  const v = variants[variant]
  const Icon = v.Icon
  return (
    <div className={[`rounded-md border ${v.border} ${v.bg} ${v.text}`, 'p-3 text-sm'].join(' ')}>
      <Icon className="mr-2 inline h-4 w-4" />{children}
    </div>
  )
}

