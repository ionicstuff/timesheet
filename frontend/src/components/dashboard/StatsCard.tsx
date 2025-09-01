import React from 'react'

interface StatsCardProps {
  title: string
  value: string
  description?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down'
  trendValue?: string
}

export default function StatsCard({ title, value, description, icon, trend, trendValue }: StatsCardProps) {
  const badge = trend && trendValue ? (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
      trend === 'up'
        ? 'bg-green-500/15 text-green-400 border-green-500/20'
        : 'bg-red-500/15 text-red-400 border-red-500/20'
    }`}>
      {trendValue}
    </span>
  ) : null

  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-[0_4px_14px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-1">{title}</div>
          <div className="text-2xl font-semibold leading-tight">{value}</div>
          {(description || badge) && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {description && <span>{description}</span>}
              {badge}
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-md border border-[var(--border-color)] flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  )
}

