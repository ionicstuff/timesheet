import React, { useEffect, useState } from 'react'
import AppShell from '../layouts/AppShell'
import { useAuth } from '../context/AuthContext'
import TimesheetService, { TimesheetStatus } from '../services/timesheet.service'

export default function DashboardNew() {
  const { user } = useAuth()
  const [status, setStatus] = useState<TimesheetStatus | null>(null)

  useEffect(() => {
    TimesheetService.getTimesheetStatus().then(setStatus).catch(() => {})
  }, [])

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.firstName || 'User'}!</h1>
            <p className="text-sm text-muted-foreground">Here's what's happening with your timesheet today.</p>
          </div>
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

        {/* Cards placeholder for next conversions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
            <h2 className="text-lg font-semibold mb-2">Time Tracking - Today</h2>
            <div className="text-sm text-muted-foreground">We will migrate the full time-tracking controls here next.</div>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
            <h2 className="text-lg font-semibold mb-2">Team Status</h2>
            <div className="text-sm text-muted-foreground">Coming up in the next pass.</div>
          </div>
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

