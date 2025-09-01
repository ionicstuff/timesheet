import React, { useEffect, useState } from 'react'
import AppShell from '../layouts/AppShell'
import { useAuth } from '../context/AuthContext'
import TimesheetService, { TimesheetStatus } from '../services/timesheet.service'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Alert from '../ui/Alert'
import taskService, { Task as UiTask } from '../services/task.service'

// Local formatting helpers (avoid relying on class static methods)
const getCurrentTimeStr = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
const formatHours = (h?: number) => (h ? Number(h).toFixed(2) : '0.00')
const formatTimeHHMM = (t?: string | null) => {
  if (!t) return '--:--'
  try {
    const p = String(t).split(':')
    return p.length >= 2 ? `${p[0]}:${p[1]}` : String(t)
  } catch {
    return '--:--'
  }
}

export default function DashboardNew() {
  const { user } = useAuth()
  const [status, setStatus] = useState<TimesheetStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [recentTasks, setRecentTasks] = useState<UiTask[]>([])
  const [taskBusy, setTaskBusy] = useState<Record<number, boolean>>({})

  useEffect(() => {
    TimesheetService.getTimesheetStatus().then(setStatus).catch(() => {})
    taskService.getMyTasks().then((all) => {
      if (!Array.isArray(all)) { setRecentTasks([]); return }
      const safe = all.filter(Boolean)
      const sorted = [...safe].sort((a: any, b: any) => {
        const tb = new Date((b as any)?.updatedAt || (b as any)?.createdAt || '').getTime() || 0
        const ta = new Date((a as any)?.updatedAt || (a as any)?.createdAt || '').getTime() || 0
        return tb - ta
      })
      setRecentTasks(sorted.slice(0, 5))
    }).catch(() => { setRecentTasks([]) })
  }, [])

  const refreshStatus = async () => {
    try { setStatus(await TimesheetService.getTimesheetStatus()) } catch {}
  }

  const toggleClock = async () => {
    setBusy(true)
    try {
      if (status?.status === 'clocked_in') await TimesheetService.clockOut(); else await TimesheetService.clockIn()
      await refreshStatus()
    } finally { setBusy(false) }
  }

  const setLoading = (id: number, val: boolean) => setTaskBusy(prev => ({ ...prev, [id]: val }))

  const quickStart = async (t: UiTask) => { if (!t.id) return; setLoading(t.id, true); try { const resp = await taskService.start(t.id); updateTask(resp.task) } finally { setLoading(t.id, false) } }
  const quickPause = async (t: UiTask) => { if (!t.id) return; setLoading(t.id, true); try { const resp = await taskService.pause(t.id); updateTask(resp.task) } finally { setLoading(t.id, false) } }
  const quickComplete = async (t: UiTask) => { if (!t.id) return; setLoading(t.id, true); try { const resp = await taskService.complete(t.id); updateTask(resp.task) } finally { setLoading(t.id, false) } }

  const updateTask = (next: UiTask) => setRecentTasks(prev => prev.map(x => x.id === next.id ? { ...x, ...next } : x))

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Heading */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="text-sm text-muted-foreground hidden md:block">
            <i className="fas fa-calendar mr-2" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiTile title="Hours Today" icon="fa-clock" value={status?.totalHours ? String(status.totalHours) : '0.0'} color="from-[var(--kpi-blue-1)] to-[var(--kpi-blue-2)]" />
          <KpiTile title="Hours This Week" icon="fa-calendar-week" value="42.5" color="from-[var(--kpi-cyan-1)] to-[var(--kpi-cyan-2)]" />
          <KpiTile title="Tasks Completed" icon="fa-tasks" value="12" color="from-[var(--kpi-green-1)] to-[var(--kpi-green-2)]" />
          <KpiTile title="Pending Approvals" icon="fa-inbox" value="6" color="from-[var(--kpi-amber-1)] to-[var(--kpi-amber-2)]" />
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickAction icon="fa-plus" title="Create Task" subtitle="Add a new task to your list" />
            <QuickAction icon="fa-calendar" title="Schedule Event" subtitle="Plan a meeting or event" />
            <QuickAction icon="fa-file-alt" title="New Document" subtitle="Create a new document" />
            <QuickAction icon="fa-user-plus" title="Invite Member" subtitle="Add someone to your team" />
            <QuickAction icon="fa-paper-plane" title="Send Message" subtitle="Communicate with your team" />
            <QuickAction icon="fa-chart-line" title="View Reports" subtitle="Check your progress analytics" />
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2" title="Time Tracking - Today" actions={
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Current Time: {getCurrentTimeStr()}</span>
            </div>
          }>
            {status ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 text-center gap-4">
                  <TimeCell label="Clock In" value={formatTimeHHMM(status.clockInTime)} color={status.clockInTime ? 'text-green-500' : 'text-muted-foreground'} />
                  <TimeCell label="Clock Out" value={formatTimeHHMM(status.clockOutTime)} color={status.clockOutTime ? 'text-red-500' : 'text-muted-foreground'} />
                  <TimeCell label="Total Hours" value={formatHours(status.totalHours)} color="text-primary" />
                  <TimeCell label="Required" value={formatTimeHHMM('08:00:00')} color="text-yellow-500" />
                </div>
                <div className="flex items-center justify-center">
                  <Button onClick={toggleClock} loading={busy} variant={status.status === 'clocked_in' ? 'danger' : 'success'} className="min-w-[140px]">
                    <i className={`fas ${status.status === 'clocked_in' ? 'fa-sign-out-alt' : 'fa-sign-in-alt'} mr-2`} />
                    {status.status === 'clocked_in' ? 'Clock Out' : 'Clock In'}
                  </Button>
                </div>
                <Alert variant={status.status === 'clocked_in' ? 'success' : status.status === 'clocked_out' ? 'info' : 'warning'}>
                  {status.status === 'clocked_in' ? `You are clocked in since ${status.clockInTime}` : status.clockOutTime ? `You clocked out at ${status.clockOutTime}` : 'You are not clocked in yet today'}
                </Alert>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading status…</div>
            )}
          </Card>

          <Card title="Recent Tasks">
            {recentTasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent tasks.</div>
            ) : (
              <ul className="space-y-3">
                {recentTasks.map(t => (
                  <li key={t.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{(t.status || '').replace('_',' ')} · {t.project?.projectCode || t.project?.projectName || `Project #${t.projectId}`}</div>
                    </div>
                    <div className="flex gap-2">
                      {(t.status === 'pending' || t.status === 'paused') && (
                        <Button variant="success" size="sm" onClick={() => quickStart(t)} loading={!!taskBusy[t.id!]}>Start</Button>
                      )}
                      {t.status === 'in_progress' && (
                        <Button variant="outline" size="sm" onClick={() => quickPause(t)} loading={!!taskBusy[t.id!]}>Pause</Button>
                      )}
                      {(t.status === 'in_progress' || t.status === 'paused' || t.status === 'pending') && (
                        <Button variant="primary" size="sm" onClick={() => quickComplete(t)} loading={!!taskBusy[t.id!]}>Complete</Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

function KpiTile({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  return (
    <div className={`rounded-lg p-4 text-white shadow-md bg-gradient-to-br ${color}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-white/20 border border-white/30 flex items-center justify-center">
          <i className={`fas ${icon}`} />
        </div>
        <div>
          <div className="text-xs opacity-85">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  )
}

function TimeCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border-r last:border-r-0 border-[var(--border-color)]">
      <div className={[color || '', 'text-xl font-mono'].join(' ')}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function QuickAction({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <button className="w-full text-left rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
          <i className={`fas ${icon}`} />
        </div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </button>
  )
}

