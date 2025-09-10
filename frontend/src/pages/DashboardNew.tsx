import React from 'react'
import AppShell from '../layouts/AppShell'
import Button from '../ui/Button'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import StatsCard from '../components/dashboard/StatsCard'
import TaskList from '../components/tasks/TaskList'
import CreateTaskButton from '../components/tasks/CreateTaskButton'
import TaskSchedulerWidget from '../components/dashboard/TaskSchedulerWidget'
import ProductivityInsights from '../components/dashboard/ProductivityInsights'
import QuickActions from '../components/dashboard/QuickActions'
import RecentActivity from '../components/dashboard/RecentActivity'
import GoalTracker from '../components/dashboard/GoalTracker'
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'

export default function DashboardNew() {
  const tasks = [
    { id: 1, title: 'Design homepage', project: 'Website Redesign', dueDate: 'Today', priority: 'High' as const, completed: false },
    { id: 2, title: 'Meeting with client', project: 'Product Launch', dueDate: 'Tomorrow', priority: 'Medium' as const, completed: false },
    { id: 3, title: 'Update documentation', project: 'Marketing Campaign', dueDate: 'In 2 days', priority: 'Low' as const, completed: true },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <CreateTaskButton />
        </div>

        <div className="grid gap-2 grid-cols-4">
        <StatsCard
          title="Total Tasks"
          value="24"
          description="+2 from last week"
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          trend="up"
          trendValue="+12%"
        />
        <StatsCard
          title="Pending Tasks"
          value="8"
          description="3 due today"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Overdue Tasks"
          value="2"
          description="Requires attention"
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Productivity"
          value="78%"
          description="+12% from last week"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend="up"
          trendValue="+12%"
        />
      </div>

        <QuickActions />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>Your tasks due soon</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Map sample tasks to your TaskList prop shape */}
              <TaskList tasks={tasks.map(t => ({ id: t.id, name: t.title, projectName: t.project }))} />
            </CardContent>
          </Card>

          <RecentActivity />
        </div>

        <GoalTracker />

        <TaskSchedulerWidget />

        <ProductivityInsights />

        <Card>
          <CardHeader>
            <CardTitle>Calendar Overview</CardTitle>
            <CardDescription>Your upcoming events and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-medium">No events scheduled</h3>
                <p className="text-sm text-muted-foreground">Your calendar is empty for the next 7 days</p>
                <Button className="mt-4">Schedule Event</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

