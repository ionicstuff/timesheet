import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import Card from '../ui/Card'
import Button from '../ui/Button'
import taskService, { Task } from '../services/task.service'
import Toast from '../components/Toast'
import { Clock, Play, Pause, StopCircle, CheckCircle, Folder } from 'lucide-react'

export default function TaskDetailNew() {
  const { id } = useParams()
  const navigate = useNavigate()
  const taskId = Number(id)

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success'|'error'|'warning'|'info'; isVisible: boolean }>({ message: '', type: 'info', isVisible: false })
  const closeToast = () => setToast(p=>({ ...p, isVisible: false }))

  const load = async () => {
    setLoading(true)
    try {
      const t = await taskService.getTask(taskId)
      setTask(t)
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load task')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (taskId) load(); else { setError('Invalid task id'); setLoading(false) } }, [taskId])

  const run = async (op: 'start'|'pause'|'resume'|'stop'|'complete') => {
    if (!task?.id) return
    setActionLoading(true)
    try {
      const api = {
        start: () => taskService.start(task.id!),
        pause: () => taskService.pause(task.id!),
        resume: () => taskService.resume(task.id!),
        stop: () => taskService.stop(task.id!),
        complete: () => taskService.complete(task.id!)
      }[op]
      const resp = await api()
      setTask(resp.task || await taskService.getTask(task.id!))
      const msg = op==='start' ? 'Task started' : op==='pause' ? 'Task paused' : op==='resume' ? 'Task resumed' : op==='stop' ? 'Task stopped' : 'Task completed'
      setToast({ message: msg, type: 'success', isVisible: true })
    } catch (e) {
      // silently ignore; page shows latest
    } finally { setActionLoading(false) }
  }

  const statusLabel = (s?: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'

  if (loading) return <AppShell><div className="p-4 text-sm text-muted-foreground">Loading task…</div></AppShell>
  if (error) return <AppShell><div className="p-4"><div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div></div></AppShell>
  if (!task) return <AppShell><div className="p-4 text-sm text-muted-foreground">Task not found.</div></AppShell>

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{task.name || '—'}</h1>
            <div className="text-xs text-muted-foreground">Project: {task.project?.projectCode || task.project?.projectName || task.projectId}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(task.status === 'pending' || task.status === 'paused') && (<Button size="sm" variant="primary" disabled={actionLoading} onClick={()=>run('start')} leftIcon={<Play className="h-4 w-4" />}>Start</Button>)}
            {task.status === 'in_progress' && (<Button size="sm" variant="danger" disabled={actionLoading} onClick={()=>run('pause')} leftIcon={<Pause className="h-4 w-4" />}>Pause</Button>)}
            {task.status === 'in_progress' && (<Button size="sm" variant="outline" disabled={actionLoading} onClick={()=>run('stop')} leftIcon={<StopCircle className="h-4 w-4" />}>Stop</Button>)}
            {task.status === 'paused' && (<Button size="sm" variant="success" disabled={actionLoading} onClick={()=>run('resume')} leftIcon={<Play className="h-4 w-4" />}>Resume</Button>)}
            <Button size="sm" variant="outline" disabled={actionLoading} onClick={()=>run('complete')} leftIcon={<CheckCircle className="h-4 w-4" />}>Complete</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="mt-1 text-sm">{statusLabel(task.status)}</div>
          </Card>
          <Card>
            <div className="text-xs text-muted-foreground">Estimated</div>
            <div className="mt-1 text-sm">{(task as any).estimatedTime ?? '—'} h</div>
          </Card>
          <Card>
            <div className="text-xs text-muted-foreground">Tracked</div>
            <div className="mt-1 text-sm">{Math.floor(((task as any).totalTrackedSeconds || 0)/3600)} h</div>
          </Card>
        </div>

        {task.description ? (
          <Card title="Description"><div className="text-sm text-foreground whitespace-pre-wrap">{task.description}</div></Card>
        ) : null}
      </div>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={closeToast} />
    </AppShell>
  )
}
