import React from 'react'

export interface SimpleTask {
  id: number | string
  name: string
  projectName?: string
  status?: string
}

export default function TaskList({ tasks = [] as SimpleTask[] }: { tasks: SimpleTask[] }) {
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center justify-between rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2">
          <div>
            <div className="font-medium">{t.name}</div>
            <div className="text-xs text-muted-foreground">{t.projectName || '-'} · {(t.status || '').replace('_', ' ')}</div>
          </div>
        </li>
      ))}
      {tasks.length === 0 && (
        <li className="text-sm text-muted-foreground">No tasks to show.</li>
      )}
    </ul>
  )
}

