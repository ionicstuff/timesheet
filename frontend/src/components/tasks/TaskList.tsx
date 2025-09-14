import React from 'react'
import { Calendar, MoreHorizontal } from 'lucide-react'

export interface SimpleTask {
  id: number | string
  name: string
  projectName?: string
  status?: string
  dueDate?: string
  priority?: 'High' | 'Medium' | 'Low'
  completed?: boolean
}

export default function TaskList({ tasks = [] as SimpleTask[] }: { tasks: SimpleTask[] }) {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ul className="space-y-3">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
          <input 
            type="checkbox" 
            checked={t.completed || false}
            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm mb-1">{t.name}</div>
            <div className="text-xs text-muted-foreground mb-2">{t.projectName || '-'}</div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t.dueDate || 'No due date'}</span>
              {t.priority && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(t.priority)}`}>
                  {t.priority}
                </span>
              )}
            </div>
          </div>
          <button className="p-1 hover:bg-muted rounded">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </li>
      ))}
      {tasks.length === 0 && (
        <li className="text-sm text-muted-foreground text-center py-8">No tasks to show.</li>
      )}
    </ul>
  )
}

