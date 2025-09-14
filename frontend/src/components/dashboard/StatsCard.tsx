import React from 'react'
import { CardHeader, CardTitle, CardContent } from '../../ui/Card'

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: 'up' | 'down'
  trendValue?: string
}

export default function StatsCard({ title, value, description, icon, trend, trendValue }: StatsCardProps) {
  const badge = trend && trendValue ? (
    trend === 'up' ? (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border"
        style={{
          backgroundColor: 'rgba(22,163,74,0.15)',
          color: '#16A34A',
          borderColor: 'rgba(22,163,74,0.20)'
        }}
      >
        {trendValue}
      </span>
    ) : (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border"
        style={{
          backgroundColor: 'rgba(239,68,68,0.15)',
          color: '#EF4444',
          borderColor: 'rgba(239,68,68,0.20)'
        }}
      >
        {trendValue}
      </span>
    )
  ) : null

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm p-4 h-full flex flex-col justify-between">
      <div className="flex flex-row items-center justify-between mb-2">
        <h3 className="text-xs font-medium">{title}</h3>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
          {badge && <span className="ml-1">{badge}</span>}
        </p>
      </div>
    </div>
  )
}

