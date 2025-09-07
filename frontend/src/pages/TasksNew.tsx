import React, { useEffect, useState } from 'react'
import AppShell from '../layouts/AppShell'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'
import taskService, { Task } from '../services/task.service'
import AddMyTaskModal from '../components/tasks/AddMyTaskModal'
import Toast from '../components/Toast'
import { Plus } from 'lucide-react'

const formatMinutes = (seconds?: number) => {
  const s = Math.floor((seconds || 0) / 60)
  const h = Math.floor(s / 60)
  const m = s % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

export default function TasksNew() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [view, setView] = useState<'table'|'board'>('table')
  const [hoverCol, setHoverCol] = useState<''|'pending'|'in_progress'|'paused'|'completed'>('')
  const [movingId, setMovingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; isVisible: boolean }>({ message: '', type: 'info', isVisible: false })
  const handleToastClose = () => setToast(prev => ({ ...prev, isVisible: false }))

  const load = async () => {
    try {
      setLoading(true)
      const data = await taskService.getMyTasks(status ? { status } : undefined)
      setTasks(Array.isArray(data) ? data : [])
      setError(null)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load tasks')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [status])

  const run = async (id: number, op: 'start'|'pause'|'resume'|'stop'|'complete') => {
    try {
      setActionLoading(id)
      const api = {
        start: () => taskService.start(id),
        pause: () => taskService.pause(id),
        resume: () => taskService.resume(id),
        stop: () => taskService.stop(id),
        complete: () => taskService.complete(id)
      }[op]
      await api()
      await load()
      const msg = op==='start' ? 'Task started' : op==='pause' ? 'Task paused' : op==='resume' ? 'Task resumed' : op==='stop' ? 'Task stopped' : 'Task completed'
      setToast({ message: msg, type: 'success', isVisible: true })
    } catch (e: any) {
      const msg = e?.response?.data?.message || `Failed to ${op} task`
      setToast({ message: msg, type: 'error', isVisible: true })
    } finally { setActionLoading(null) }
  }

  const statusKey = (s?: string) => {
    const raw = (s || '').toLowerCase()
    switch (raw) {
      case 'in_progress':
      case 'in-progress':
      case 'progress': return 'inprogress'
      case 'paused': return 'paused'
      case 'completed': return 'completed'
      case 'pending':
      default: return 'pending'
    }
  }
  const statusLabel = (s?: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'

  const BoardColumn: React.FC<{ keyId: 'pending'|'in_progress'|'paused'|'completed'; title: string; items: Task[] }>
    = ({ keyId, title, items }) => (
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)]">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-3 py-2 text-sm font-semibold">
          <span>{title}</span>
          <span className="text-xs text-muted-foreground">{items.length}</span>
        </div>
        <div
          className={["p-3 min-h-[220px]", hoverCol===keyId?"outline outline-2 outline-blue-500/50 -outline-offset-2":""].join(' ')}
          onDragOver={(e)=>{ e.preventDefault() }}
          onDragEnter={()=>setHoverCol(keyId)}
          onDragLeave={()=>setHoverCol('')}
          onDrop={async (e)=>{
            e.preventDefault()
            setHoverCol('')
            const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
            if (!raw) return
            let payload: any; try { payload = JSON.parse(raw) } catch { return }
            const { id, status: from } = payload || {}
            if (!id) return
            if (from === keyId) return
            setMovingId(id)
            try {
              if (keyId === 'in_progress') {
                if (from === 'pending') await taskService.start(id)
                else if (from === 'paused') await taskService.resume(id)
                else throw new Error('Only Pending or Paused can move to In Progress')
              } else if (keyId === 'paused') {
                if (from === 'in_progress') await taskService.pause(id)
                else throw new Error('Only In Progress can be paused')
              } else if (keyId === 'completed') {
                await taskService.complete(id)
              } else if (keyId === 'pending') {
                throw new Error('Cannot move tasks back to Pending')
              }
              await load()
            } catch (err: any) {
              const msg = err?.response?.data?.message || err?.message || 'Failed to move task'
              setToast({ message: msg, type: 'error', isVisible: true })
            } finally { setMovingId(null) }
          }}
        >
          <div className="flex flex-col gap-2">
            {items.map(t => {
              const sKey = statusKey(t.status)
              const isMoving = movingId === t.id
              return (
                <div key={t.id}
                  className="cursor-grab rounded-md border border-[var(--border-color)] bg-[var(--primary-bg)] p-3 shadow"
                  draggable
                  onDragStart={(e)=>{ e.dataTransfer.setData('application/json', JSON.stringify({ id: t.id, status: t.status })) }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{t.name}</div>
                    <span className={[
                      'inline-block rounded-full px-2 py-0.5 text-xs',
                      sKey==='inprogress' ? 'bg-blue-500/15 text-blue-600' :
                      sKey==='paused' ? 'bg-yellow-500/15 text-yellow-700' :
                      sKey==='completed' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-600'
                    ].join(' ')}>{statusLabel(t.status)}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{t.project?.projectCode || t.project?.projectName || `Project #${t.projectId}`}</div>
                  <div className="text-xs text-muted-foreground">Tracked: {formatMinutes((t as any).totalTrackedSeconds)} · Est: {(t as any).estimatedTime ?? '—'}h</div>
                  {isMoving && <div className="mt-1 text-xs text-muted-foreground"><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--border-color)] border-t-transparent mr-1"/>Updating…</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={()=>setShowAdd(true)}>Add Task</Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Button variant={view==='table'?'primary':'outline'} size="sm" onClick={()=>setView('table')}>Table</Button>
              <Button variant={view==='board'?'primary':'outline'} size="sm" onClick={()=>setView('board')}>Kanban</Button>
            </div>
            <select className="h-9 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Card><div className="py-10 text-center text-sm text-muted-foreground">Loading tasks…</div></Card>
        ) : error ? (
          <Card><div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div></Card>
        ) : tasks.length === 0 ? (
          <Card><div className="py-10 text-center text-sm text-muted-foreground">No tasks found.</div></Card>
        ) : (
          view === 'table' ? (
            <Card>
              <div className="overflow-auto">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="bg-[var(--primary-bg)] text-muted-foreground">
                      <th className="px-3 py-2 text-left">Task</th>
                      <th className="px-3 py-2 text-left">Project</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Tracked</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => {
                      const isRunning = t.status === 'in_progress' && (t as any).activeTimerStartedAt
                      const sKey = statusKey(t.status)
                      return (
                        <tr key={t.id} className="border-t border-[var(--border-color)]">
                          <td className="px-3 py-2">{t.name}</td>
                          <td className="px-3 py-2">{t.project?.projectCode || t.project?.projectName || t.projectId}</td>
                          <td className="px-3 py-2">
                            <span className={[
                              'inline-block rounded-full px-2 py-0.5 text-xs',
                              sKey==='inprogress' ? 'bg-blue-500/15 text-blue-600' :
                              sKey==='paused' ? 'bg-yellow-500/15 text-yellow-700' :
                              sKey==='completed' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-600'
                            ].join(' ')}>{statusLabel(t.status)}</span>
                          </td>
                          <td className="px-3 py-2">{formatMinutes((t as any).totalTrackedSeconds)}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {(t.status === 'pending' || t.status === 'paused') && (
                                <Button variant="primary" size="sm" disabled={actionLoading===t.id} onClick={()=>run(t.id!, 'start')}>Start</Button>
                              )}
                              {isRunning && (
                                <>
                                  <Button variant="danger" size="sm" disabled={actionLoading===t.id} onClick={()=>run(t.id!, 'pause')}>Pause</Button>
                                  <Button variant="outline" size="sm" disabled={actionLoading===t.id} onClick={()=>run(t.id!, 'stop')}>Stop</Button>
                                </>
                              )}
                              {t.status === 'paused' && (
                                <Button variant="success" size="sm" disabled={actionLoading===t.id} onClick={()=>run(t.id!, 'resume')}>Resume</Button>
                              )}
                              <Button variant="outline" size="sm" disabled={actionLoading===t.id} onClick={()=>run(t.id!, 'complete')}>Complete</Button>
                              <Button variant="outline" size="sm" onClick={()=>window.location.assign(`/tasks/${t.id}`)}>Open</Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <BoardColumn keyId="pending" title="Pending" items={tasks.filter(t => t.status==='pending')} />
              <BoardColumn keyId="in_progress" title="In Progress" items={tasks.filter(t => t.status==='in_progress')} />
              <BoardColumn keyId="paused" title="Paused" items={tasks.filter(t => t.status==='paused')} />
              <BoardColumn keyId="completed" title="Completed" items={tasks.filter(t => t.status==='completed')} />
            </div>
          )
        )}

        <AddMyTaskModal isOpen={showAdd} onClose={()=>setShowAdd(false)} onCreated={load} />
        <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={handleToastClose} />
      </div>
    </AppShell>
  )
}

