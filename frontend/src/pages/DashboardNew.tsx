import React, { useEffect, useState } from 'react'
import AppShell from '../layouts/AppShell'
import { useAuth } from '../context/AuthContext'
import TimesheetService, { TimesheetStatus } from '../services/timesheet.service'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Alert from '../ui/Alert'
import taskService, { Task as UiTask } from '../services/task.service'
import StatsCard from '../components/dashboard/StatsCard'
import TaskList from '../components/tasks/TaskList'
import CreateTaskButton from '../components/tasks/CreateTaskButton'
import RecentActivity from '../components/dashboard/RecentActivity'
import GoalTracker from '../components/dashboard/GoalTracker'
import Achievements from '../components/dashboard/Achievements'
import { CheckCircle, Clock as ClockIcn, AlertCircle, TrendingUp, Calendar as CalendarIcon, UserPlus, FileText, MessageSquare, BarChart2, Plus, LogIn, LogOut } from 'lucide-react'

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
  const [allTasks, setAllTasks] = useState<UiTask[]>([])
  const [taskBusy, setTaskBusy] = useState<Record<number, boolean>>({})

  useEffect(() => {
    TimesheetService.getTimesheetStatus().then(setStatus).catch(() => {})
    taskService.getMyTasks().then((all) => {
      if (!Array.isArray(all)) { setAllTasks([]); setRecentTasks([]); return }
      const safe = all.filter(Boolean)
      setAllTasks(safe)
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
      <div className="space-y-4">
        {/* Heading */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <CreateTaskButton />
        </div>

        {/* Stats row similar to reference */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Tasks" value={String(allTasks.length || 0)} description="From your workspace" icon={<CheckCircle className="h-4 w-4" />} trend="up" trendValue="+0%" />
          <StatsCard title="Pending Tasks" value={String(allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length || 0)} description="including in-progress" icon={<ClockIcn className="h-4 w-4" />} />
          <StatsCard title="Overdue Tasks" value={String(0)} description="Requires attention" icon={<AlertCircle className="h-4 w-4" />} />
          <StatsCard title="Productivity" value={`${allTasks.length ? Math.round((allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100) : 0}%`} description="vs recent" icon={<TrendingUp className="h-4 w-4" />} trend="up" trendValue="+0%" />
        </div>

        {/* Quick Actions - full width */}
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <p className="text-sm text-muted-foreground">Get started with common tasks</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAction colorClass="bg-blue-500 text-white" icon={<Plus className="h-5 w-5" />} title="Create Task" subtitle="Add a new task to your list" />
            <QuickAction colorClass="bg-green-500 text-white" icon={<CalendarIcon className="h-5 w-5" />} title="Schedule Event" subtitle="Plan a meeting or event" />
            <QuickAction colorClass="bg-purple-500 text-white" icon={<FileText className="h-5 w-5" />} title="New Document" subtitle="Create a new document" />
            <QuickAction colorClass="bg-orange-500 text-white" icon={<UserPlus className="h-5 w-5" />} title="Invite Member" subtitle="Add someone to your team" />
            <QuickAction colorClass="bg-pink-500 text-white" icon={<MessageSquare className="h-5 w-5" />} title="Send Message" subtitle="Communicate with your team" />
            <QuickAction colorClass="bg-indigo-500 text-white" icon={<BarChart2 className="h-5 w-5" />} title="View Reports" subtitle="Check your progress analytics" />
          </div>
        </div>

        {/* Row 0: Time Tracking + Calendar Overview (50% each) */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          {/* Time Tracking */}
          <div className="sm:w-1/2">
          <Card className="h-full" title="Time Tracking - Today" actions={
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
                    {status.status === 'clocked_in' ? <LogOut className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
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
          </div>

          {/* Calendar Overview */}
          <div className="sm:w-1/2">
          <Card className="h-full" title="Calendar Overview">
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <CalendarIcon className="h-6 w-6 mb-3" />
                <div className="text-foreground mb-1">No events scheduled</div>
                <div className="text-sm">Your calendar is empty for the next 7 days</div>
                <Button className="mt-4" size="sm" leftIcon={<Plus className="h-4 w-4" />}>Schedule Event</Button>
              </div>
            </div>
          </Card>
          </div>
        </div>

        {/* Row 1: Upcoming Tasks + Recent Activity */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          <div className="sm:w-1/2">
          <Card className="h-full" title="Upcoming Tasks">
            <TaskList
              tasks={recentTasks.map(t => ({ id: t.id!, name: t.name || 'Untitled task', projectName: t.project?.projectName || t.project?.projectCode, status: t.status }))}
            />
          </Card>
          </div>
          <div className="sm:w-1/2">
            <RecentActivity />
          </div>
        </div>

        {/* Row 2: Goal Progress + Achievements */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          <div className="sm:w-1/2"><GoalTracker /></div>
          <div className="sm:w-1/2"><Achievements /></div>
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

function QuickAction({ icon, title, subtitle, colorClass }: { icon: React.ReactNode; title: string; subtitle: string; colorClass?: string }) {
  return (
    <button className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-6 hover:bg-white/5 transition-colors text-center">
      <div className="flex flex-col items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass || 'bg-primary/15 text-primary'}`}>
          {icon}
        </div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </button>
  )
}

