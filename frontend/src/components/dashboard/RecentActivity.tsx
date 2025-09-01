import React from 'react'
import Card from '../../ui/Card'

export default function RecentActivity() {
  const items = [
    { icon: 'fa-clock', title: 'Clocked in', sub: 'Today at 9:30 AM' },
    { icon: 'fa-check', title: 'Task completed: Frontend Development', sub: 'Yesterday at 5:45 PM' },
    { icon: 'fa-calendar', title: 'Leave request submitted', sub: '2 days ago' },
  ]
  return (
    <Card title="Recent Activity">
      <ul className="space-y-3">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/15 text-primary flex items-center justify-center">
              <i className={`fas ${it.icon}`} />
            </div>
            <div>
              <div className="font-medium">{it.title}</div>
              <div className="text-xs text-muted-foreground">{it.sub}</div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

