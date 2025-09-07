import React from 'react'
import Card from '../../ui/Card'
import type { SprintItem } from './ProjectSprintCalendar'

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(b.getTime() - a.getTime())
  return Math.max(1, Math.round(ms / (1000*60*60*24)))
}

export default function ProjectSprintVisualization({ sprints = [] as SprintItem[] }: { sprints: SprintItem[] }) {
  // Determine relative widths based on duration
  const durations = sprints.map(s => {
    const sd = new Date(s.startDate as any)
    const ed = new Date(s.endDate as any)
    return daysBetween(sd, ed)
  })
  const max = Math.max(...durations, 1)

  return (
    <Card title="Sprint Timeline">
      {sprints.length === 0 ? (
        <div className="text-sm text-muted-foreground">No sprints to visualize.</div>
      ) : (
        <div className="space-y-3">
          {sprints.map((s, idx) => {
            const w = Math.max(8, Math.round((durations[idx] / max) * 100))
            const color = s.status === 'completed' ? 'bg-emerald-500' : s.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-500'
            return (
              <div key={s.id} className="rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="font-medium text-foreground">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{durations[idx]} day{durations[idx]===1?'':'s'}</div>
                </div>
                <div className="h-2 w-full rounded bg-[var(--border-color)]">
                  <div className={`h-2 rounded ${color}`} style={{ width: `${w}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

