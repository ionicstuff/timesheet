import React from 'react'
import Card from '../../ui/Card'
import { Award } from 'lucide-react'

export default function Achievements() {
  const items = [
    { title: 'Task Master', desc: 'Completed 50 tasks this month', color: 'text-amber-600 bg-amber-100' },
    { title: 'Early Bird', desc: 'Submitted 10 tasks ahead of schedule', color: 'text-pink-600 bg-pink-100' },
    { title: 'Team Player', desc: 'Collaborated on 15 tasks this month', color: 'text-indigo-600 bg-indigo-100' },
  ]
  return (
    <Card title="Achievements" className="h-full">
      <ul className="space-y-3">
        {items.map((x, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${x.color}`}>
              <Award className="h-4 w-4" />
            </span>
            <div>
              <div className="font-medium">{x.title}</div>
              <div className="text-xs text-muted-foreground">{x.desc}</div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

