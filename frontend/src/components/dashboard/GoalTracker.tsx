import React from 'react'
import Card from '../../ui/Card'

export default function GoalTracker() {
  const goals = [
    { label: 'Weekly tasks', value: 60 },
    { label: 'Documentation', value: 35 },
    { label: 'Code reviews', value: 80 },
  ]
  return (
    <Card title="Goal Tracker">
      <div className="space-y-3">
        {goals.map((g, i) => (
          <div key={i}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{g.label}</span>
              <span className="text-muted-foreground">{g.value}%</span>
            </div>
            <div className="h-2 rounded bg-white/10">
              <div className="h-2 rounded bg-primary" style={{ width: `${g.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

