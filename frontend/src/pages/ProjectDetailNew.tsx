import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import Button from '../ui/Button'
import Card from '../ui/Card'
import TaskList from '../components/tasks/TaskList'
import CreateTaskButton from '../components/tasks/CreateTaskButton'
import ProjectService, { Project } from '../services/project.service'
import taskService, { Task as ApiTask } from '../services/task.service'
import { Calendar as CalendarIcon, Users, BarChart3, CheckCircle, Clock, Pencil, Plus, FileText, MoreHorizontal } from 'lucide-react'
import ProjectSprintCalendar, { SprintItem } from '../components/projects/ProjectSprintCalendar'
import ProjectSprintVisualization from '../components/projects/ProjectSprintVisualization'
import EditProjectModal from '../components/projects/EditProjectModal'
import AddMyTaskModal from '../components/tasks/AddMyTaskModal'
import Toast from '../components/Toast'

export default function ProjectDetailNew() {
  const { id } = useParams()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [files, setFiles] = useState<any[]>([])

  // Modals
  const [editOpen, setEditOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success'|'error'|'warning'|'info'; isVisible: boolean }>({ message: '', type: 'info', isVisible: false })
  const closeToast = () => setToast(p=>({ ...p, isVisible: false }))

  useEffect(() => {
    let alive = true
    const load = async () => {
      if (!projectId) { setError('Invalid project id'); setLoading(false); return }
      setLoading(true)
      try {
        const [p, t] = await Promise.all([
          ProjectService.getProject(projectId).catch(() => null),
          taskService.getTasksByProject(projectId).catch(() => [])
        ])
        if (!alive) return
        setProject(p as any)
        setTasks(Array.isArray(t) ? t : [])
        try {
          const f = await ProjectService.getProjectFiles(projectId)
          if (alive) setFiles(Array.isArray(f) ? f : [])
        } catch {}
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load project')
      } finally { if (alive) setLoading(false) }
    }
    load()
    return () => { alive = false }
  }, [projectId])

  const sKey = useMemo(() => {
    const s = (project?.status || (project?.isActive ? 'active' : 'archived'))?.toString().toLowerCase()
    switch (s) {
      case 'in_progress':
      case 'in-progress':
      case 'progress': return 'inprogress'
      case 'on_hold':
      case 'on-hold': return 'onhold'
      case 'blocked': return 'blocked'
      case 'completed': return 'completed'
      case 'active': return 'active'
      default: return 'archived'
    }
  }, [project?.status, project?.isActive])

  const tasksCount = tasks.length || (project as any)?.tasksCount || 0
  const openTasks = (project as any)?.openTasksCount || (tasks.filter(t => t.status !== 'completed').length) || 0
  const completedTasks = Math.max(0, tasksCount - openTasks)
  const progress = tasksCount > 0 ? Math.max(0, Math.min(100, Math.round((completedTasks / tasksCount) * 100))) : 0

  const startDate = (project as any)?.startDate || (project as any)?.start_date || ''
  const endDate = (project as any)?.endDate || (project as any)?.end_date || ''
  const fmt = (val?: string) => {
    try { if (!val) return '—'; const d = new Date(val as any); return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' }) } catch { return '—' }
  }

  // Build stub sprints from available dates
  const sprints: SprintItem[] = useMemo(() => {
    const sdRaw: any = (project as any)?.startDate || (project as any)?.start_date
    const edRaw: any = (project as any)?.endDate || (project as any)?.end_date
    let start = new Date()
    let end = new Date()
    let valid = false
    try {
      if (sdRaw) {
        const d = new Date(sdRaw)
        if (!isNaN(d.getTime())) { start = d; valid = true }
      }
      if (edRaw) {
        const d = new Date(edRaw)
        if (!isNaN(d.getTime())) { end = d; valid = valid && true }
      }
    } catch {}

    if (!valid || isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      // Fallback: 3 weekly sprints from today
      const base = new Date()
      const s1e = new Date(base); s1e.setDate(base.getDate()+7)
      const s2s = new Date(s1e); const s2e = new Date(s2s); s2e.setDate(s2s.getDate()+7)
      const s3s = new Date(s2e); const s3e = new Date(s3s); s3e.setDate(s3s.getDate()+7)
      return [
        { id: 1, title: 'Sprint 1: Planning', startDate: base, endDate: s1e, status: 'completed', tasks: 5, completed: 5 },
        { id: 2, title: 'Sprint 2: Execution', startDate: s2s, endDate: s2e, status: 'in-progress', tasks: 8, completed: 4 },
        { id: 3, title: 'Sprint 3: QA', startDate: s3s, endDate: s3e, status: 'planned', tasks: 6, completed: 0 },
      ]
    }

    // Build 2-week sprints across the date range
    const MS_2W = 14 * 24 * 60 * 60 * 1000
    const totalMs = Math.max(1, end.getTime() - start.getTime())
    const count = Math.max(1, Math.ceil(totalMs / MS_2W))

    const sprints: SprintItem[] = []
    let cursor = new Date(start)
    const today = new Date().getTime()
    const mkStatus = (a: Date, b: Date): SprintItem['status'] => today > b.getTime() ? 'completed' : (today >= a.getTime() && today <= b.getTime() ? 'in-progress' : 'planned')

    for (let i = 0; i < count; i++) {
      const s = new Date(cursor)
      const e = new Date(Math.min(cursor.getTime() + MS_2W, end.getTime()))
      sprints.push({ id: i+1, title: `Sprint ${i+1}`, startDate: s, endDate: e, status: mkStatus(s, e), tasks: 6 + (i%3), completed: i===0 ? 4 : 0 })
      cursor = new Date(e.getTime() + 1)
    }

    return sprints
  }, [project])

  const teamMembers: Array<{ name: string }> = useMemo(() => {
    const raw = (project as any)?.teamMembers || []
    if (Array.isArray(raw) && raw.length) {
      const names = raw.map((tm: any) => {
        const a = tm?.assignedTo || tm?.assigned_to || tm?.user || {}
        const fn = a.firstName || a.firstname || ''
        const ln = a.lastName || a.lastname || ''
        const name = `${fn} ${ln}`.trim()
        return name || (a.email || '')
      }).filter(Boolean)
      return Array.from(new Set(names)).map(n => ({ name: n }))
    }
    const m = (project as any)?.manager
    if (m?.firstName || m?.lastName) return [{ name: `${m.firstName || ''} ${m.lastName || ''}`.trim() }]
    return []
  }, [project])

  const reloadTasks = async () => {
    try {
      const t = await taskService.getTasksByProject(projectId)
      setTasks(Array.isArray(t) ? t : [])
    } catch {}
  }

  if (loading) return (
    <AppShell>
      <div className="p-4 text-sm text-muted-foreground">Loading project…</div>
    </AppShell>
  )
  if (error) return (
    <AppShell>
      <div className="p-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      </div>
    </AppShell>
  )
  if (!project) return (
    <AppShell>
      <div className="p-4 text-sm text-muted-foreground">Project not found.</div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
              <h1 className="text-2xl font-bold">{project.name || '—'}</h1>
              <span className={[
                'inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                sKey==='active' ? 'bg-green-500/15 text-green-600' :
                sKey==='inprogress' ? 'bg-blue-500/15 text-blue-600' :
                sKey==='onhold' ? 'bg-yellow-500/15 text-yellow-700' :
                sKey==='blocked' ? 'bg-red-500/15 text-red-600' :
                sKey==='completed' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-600'
              ].join(' ')}>
                {sKey.replace('inprogress','IN PROGRESS').replace(/\b\w/g,c=>c.toUpperCase())}
              </span>
            </div>
            {project.description ? (
              <p className="max-w-3xl text-sm text-muted-foreground">{project.description}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=> setEditOpen(true)} leftIcon={<Pencil className="h-4 w-4" />}>Edit Project</Button>
            <Button variant="primary" onClick={()=> setAddTaskOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Add Task</Button>
          </div>
        </div>

        {/* Overview */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card title="Project Overview">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-[var(--border-color)] p-4">
                  <div className="flex items-center text-muted-foreground text-xs">
                    <BarChart3 className="mr-2 h-4 w-4" />Progress
                  </div>
                  <div className="mt-2 text-2xl font-bold">{progress}%</div>
                  <div className="mt-2 h-2 w-full rounded bg-[var(--border-color)]">
                    <div className="h-2 rounded bg-blue-600" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border-color)] p-4">
                  <div className="flex items-center text-muted-foreground text-xs">
                    <CheckCircle className="mr-2 h-4 w-4" />Completed
                  </div>
                  <div className="mt-2 text-2xl font-bold">{completedTasks}</div>
                </div>
                <div className="rounded-lg border border-[var(--border-color)] p-4">
                  <div className="flex items-center text-muted-foreground text-xs">
                    <Clock className="mr-2 h-4 w-4" />Pending
                  </div>
                  <div className="mt-2 text-2xl font-bold">{openTasks}</div>
                </div>
                <div className="rounded-lg border border-[var(--border-color)] p-4">
                  <div className="flex items-center text-muted-foreground text-xs">
                    <Users className="mr-2 h-4 w-4" />Members
                  </div>
                  <div className="mt-2 text-2xl font-bold">{teamMembers.length}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-medium">Timeline</h3>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{fmt(startDate)} - {fmt(endDate)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium">Key Dates</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Kickoff</span>
                      <span>{fmt(startDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Delivery</span>
                      <span>{fmt(endDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Sprints */}
            <ProjectSprintCalendar sprints={sprints} />
            <ProjectSprintVisualization sprints={sprints} />

            {/* Project Tasks */}
            <Card title="Project Tasks" actions={<div className="flex items-center gap-2"><CreateTaskButton /><Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />}>Add Task</Button></div>}>
              <div className="rounded-lg border border-[var(--border-color)]">
                <div className="border-b border-[var(--border-color)] p-3 text-sm font-medium text-foreground">Tasks for this project</div>
                <div className="p-3">
                  <TaskList
                    tasks={(tasks || []).map(t => ({ id: t.id!, name: t.name || 'Untitled task', projectName: project.name, status: t.status }))}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card title="Team Members">
              <div className="space-y-3">
                {(teamMembers || []).map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-[var(--secondary-bg)] border border-[var(--border-color)] text-[10px] flex items-center justify-center text-foreground">
                        {m.name.split(' ').map(x=>x[0]).join('').toUpperCase()}
                      </div>
                      <div className="text-sm">{m.name}</div>
                    </div>
                    <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <div className="text-sm text-muted-foreground">No team assigned.</div>
                )}
                <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />}>Add Member</Button>
              </div>
            </Card>

            <Card title="Project Files">
              <div className="space-y-2">
                {(files || []).map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded px-2 py-2 hover:bg-[var(--secondary-bg)]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-xs text-blue-800">
                        {(f?.originalName || f?.filename || 'FILE').split('.').pop()?.slice(0,3)?.toUpperCase() || 'FILE'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{f?.originalName || f?.filename || 'File'}</div>
                        <div className="text-xs text-muted-foreground">{f?.fileType || f?.type || ''}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="text-sm text-muted-foreground">No files uploaded.</div>
                )}
                <Button variant="outline" size="sm" leftIcon={<FileText className="h-4 w-4" />}>Upload File</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProjectModal
        project={project as any}
        isOpen={editOpen}
        onClose={()=> setEditOpen(false)}
        onProjectUpdated={(updated)=>{
          setProject(prev => prev && prev.id === updated.id ? ({ ...prev, ...updated } as any) : updated)
          setEditOpen(false)
          setToast({ message: 'Project updated', type: 'success', isVisible: true })
        }}
      />
      <AddMyTaskModal
        isOpen={addTaskOpen}
        onClose={()=> setAddTaskOpen(false)}
        onCreated={reloadTasks}
        defaultProjectId={project?.id}
      />
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={closeToast} />
    </AppShell>
  )
}

