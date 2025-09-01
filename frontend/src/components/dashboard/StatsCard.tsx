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
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-[0_4px_14px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-1">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
          {description ? (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>{description}</span>
              {trend && trendValue ? (
                <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>{trendValue}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="w-10 h-10 rounded-md border border-[var(--border-color)] flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  )
}

