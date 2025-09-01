import React from 'react'
import Card from '../../ui/Card'
import { Clock, Check, CalendarDays } from 'lucide-react'

export default function RecentActivity() {
  const items = [
    { icon: <Clock className="h-4 w-4" />, title: 'Clocked in', sub: 'Today at 9:30 AM' },
    { icon: <Check className="h-4 w-4" />, title: 'Task completed: Frontend Development', sub: 'Yesterday at 5:45 PM' },
    { icon: <CalendarDays className="h-4 w-4" />, title: 'Leave request submitted', sub: '2 days ago' },
  ]
  return (
    <Card title="Recent Activity">
      <ul className="space-y-3">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/15 text-primary flex items-center justify-center">
              {it.icon}
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

