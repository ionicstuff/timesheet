import React from 'react'
import Card from '../../ui/Card'

export type SprintStatus = 'planned' | 'in-progress' | 'completed'
export interface SprintItem {
  id: number | string
  title: string
  startDate: string | Date
  endDate: string | Date
  status: SprintStatus
  tasks?: number
  completed?: number
}

function fmt(d: string | Date) {
  try {
    const date = new Date(d as any)
    if (isNaN(date.getTime())) return String(d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return String(d) }
}

export default function ProjectSprintCalendar({ sprints = [] as SprintItem[] }: { sprints: SprintItem[] }) {
  return (
    <Card title="Sprint Calendar">
      {sprints.length === 0 ? (
        <div className="text-sm text-muted-foreground">No sprints planned.</div>
      ) : (
        <div className="space-y-3">
          {sprints.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
              <div>
                <div className="font-medium text-foreground">{s.title}</div>
                <div className="text-xs text-muted-foreground">{fmt(s.startDate)} – {fmt(s.endDate)}</div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {typeof s.tasks === 'number' ? (
                  <span className="rounded-full border border-[var(--border-color)] px-2 py-0.5">{s.completed ?? 0}/{s.tasks} done</span>
                ) : null}
                <span className={[
                  'inline-block rounded-full px-2 py-0.5 font-semibold',
                  s.status === 'completed' ? 'bg-emerald-500/15 text-emerald-700' :
                  s.status === 'in-progress' ? 'bg-blue-500/15 text-blue-700' : 'bg-slate-500/15 text-slate-700'
                ].join(' ')}>
                  {s.status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

