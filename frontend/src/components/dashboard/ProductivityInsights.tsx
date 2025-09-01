import React from 'react'
import Card from '../../ui/Card'

export default function ProductivityInsights() {
  const items = [
    { label: 'Completion rate', value: '78%' },
    { label: 'Avg. task duration', value: '1.2h' },
    { label: 'Focus time', value: '4.5h' },
  ]
  return (
    <Card title="Productivity Insights">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((x, i) => (
          <div key={i} className="rounded-md border border-[var(--border-color)] p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">{x.label}</div>
            <div className="text-xl font-semibold">{x.value}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

