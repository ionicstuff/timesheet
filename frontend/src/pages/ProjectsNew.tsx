import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { Plus, Search, Eye, Pencil, Users, ListChecks, CheckCircle, MoreHorizontal } from 'lucide-react'
import ProjectService, { Project } from '../services/project.service'
import EditProjectModal from '../components/projects/EditProjectModal'
import Toast from '../components/Toast'
import AddProjectModal from '../components/projects/AddProjectModal'


type SortKey = 'projectName' | 'projectCode' | 'clientName' | 'createdAt' | 'status' | 'members' | 'tasks'

export default function ProjectsNew() {
  // data
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ui state
  const [q, setQ] = useState('')
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [sortBy, setSortBy] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(10)

  // filters
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // modals
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // team preview cache for visible projects (id -> member names)
  const [teamPreview, setTeamPreview] = useState<Record<number, string[]>>({})

  const navigate = useNavigate()
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true)
        const data = await ProjectService.getProjects()
        setProjects(Array.isArray(data) ? data : [])
        setError(null)
      } catch (e: any) {
        setError(e?.message || 'Failed to load projects')
      } finally { setIsLoading(false) }
    })()
  }, [])

  const statusKey = (p: Project): string => {
    const s = (p.status || (p.isActive ? 'active' : 'archived')).toString().toLowerCase()
    switch (s) {
      case 'active': return 'active'
      case 'in_progress':
      case 'in-progress':
      case 'progress': return 'inprogress'
      case 'on_hold':
      case 'on-hold': return 'onhold'
      case 'blocked': return 'blocked'
      case 'completed': return 'completed'
      case 'archived':
      default: return 'archived'
    }
  }

  const toTitle = (s?: string) => s ? s.replace(/\s+/g, ' ').trim().split(' ').map(w => (w[0]?.toUpperCase() || '') + w.slice(1)).join(' ') : ''
  const createdAt = (p: Project) => {
    const raw: any = (p as any).createdAt ?? (p as any).created_at
    const d = raw ? new Date(raw) : null
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—'
  }

  // Extract member names from a project object (list or details shape)
  const extractMemberNames = (proj: any): string[] => {
    const arr = (proj?.teamMembers || []) as any[]
    const names = arr.map(tm => {
      const a = tm?.assignedTo || tm?.assigned_to || {}
      const fn = a.firstName || a.firstname || ''
      const ln = a.lastName || a.lastname || ''
      return `${fn} ${ln}`.trim()
    }).filter(Boolean)
    return Array.from(new Set(names))
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    let base = term ? projects.filter(p => [p.name, p.projectCode, p.client?.name]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(term))) : projects

    if (selectedStatus) {
      // match normalized status key
      base = base.filter(p => {
        const s = (p.status || (p.isActive ? 'active' : 'archived')).toString().toLowerCase()
        const norm = s === 'in-progress' ? 'in_progress' : s
        return norm === selectedStatus
      })
    }

    const sorted = [...base].sort((a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const getVal = (p: Project, key: SortKey) => {
        switch (key) {
          case 'projectName': return p.name || ''
          case 'projectCode': return p.projectCode || ''
          case 'clientName': return p.client?.name || ''
          case 'createdAt': return new Date((p as any).createdAt ?? (p as any).created_at ?? 0).getTime()
          case 'status': return statusKey(p)
          case 'members': return (p.membersCount ?? (p.teamMembers?.length ?? 0))
          case 'tasks': return (p.tasksCount ?? (p.tasks?.length ?? 0))
        }
      }
      const va: any = getVal(a, sortBy)
      const vb: any = getVal(b, sortBy)
      if (va < vb) return -1 * dir
      if (va > vb) return  1 * dir
      return 0
    })

    return sorted
  }, [projects, q, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rows))
  const pageSafe = Math.min(page, totalPages)
  const paged = useMemo(() => filtered.slice((pageSafe-1)*rows, (pageSafe-1)*rows + rows), [filtered, pageSafe, rows])

  // Fetch team preview for currently visible projects (limit to paged results)
  useEffect(() => {
    const missing = paged.filter(p => !teamPreview[p.id] && (p.membersCount ?? 0) > 0)
    if (missing.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        const results = await Promise.all(missing.map(p => ProjectService.getProject(p.id).catch(() => null)))
        const updates: Record<number, string[]> = {}
        results.forEach((full, idx) => {
          if (!full) return
          const names = extractMemberNames(full)
          updates[missing[idx].id] = names
        })
        if (!cancelled && Object.keys(updates).length) {
          setTeamPreview(prev => ({ ...prev, ...updates }))
        }
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [paged, teamPreview])

  const onSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d==='asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('asc') }
  }

  const [toast, setToast] = useState<{ message: string; type: 'success'|'error'|'warning'|'info'; isVisible: boolean }>({ message: '', type: 'info', isVisible: false })
  const closeToast = () => setToast(p=>({ ...p, isVisible: false }))
  const handleProjectUpdated = (updated: Project) => { setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p)); setToast({ message: 'Project updated', type: 'success', isVisible: true }) }

  const handleCloseProject = async (p: Project) => {
    const sKey = statusKey(p)
    if (sKey === 'completed') return

    const tasksCount = p.tasksCount ?? (p.tasks?.length ?? 0)
    const openTasks = p.openTasksCount ?? (tasksCount > 0 ? tasksCount : 0)

    if (tasksCount === 0 || openTasks === 0) {
      try {
        await ProjectService.closeProject(p.id)
        setProjects(prev => prev.map(x => x.id === p.id ? { ...x, status: 'completed' } as Project : x))
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to close project'
        setError(msg)
      }
      return
    }

    if (!window.confirm(`This project has ${openTasks} open task(s). You can only close a project when all tasks are completed. Do you want to try closing anyway?`)) return
    try {
      await ProjectService.closeProject(p.id)
      setProjects(prev => prev.map(x => x.id === p.id ? { ...x, status: 'completed' } as Project : x))
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to close project'
      setError(msg)
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Heading + actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={()=>setShowAdd(true)}>Add Project</Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="w-64"><Input placeholder="Search projects…" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(1) }} leftIcon={<Search className="h-4 w-4" />} /></div>
            <select
              className="h-9 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground"
              value={selectedStatus}
              onChange={(e)=>{ setSelectedStatus(e.target.value); setPage(1); setSelectedIds([]) }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <div className="hidden sm:block text-sm text-muted-foreground">{filtered.length} results</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view==='table'?'primary':'outline'} size="sm" onClick={()=>setView('table')}>Table</Button>
            <Button variant={view==='grid'?'primary':'outline'} size="sm" onClick={()=>setView('grid')}>Grid</Button>
            <select className="h-9 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={rows} onChange={(e)=>{ setRows(Number(e.target.value)); setPage(1) }}>
              {[10,20,50].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card><div className="py-10 text-center text-sm text-muted-foreground">Loading projects…</div></Card>
        ) : error ? (
          <Card><div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div></Card>
        ) : projects.length === 0 ? (
          <Card><div className="py-10 text-center text-sm text-muted-foreground">No projects found. Click “Add Project”.</div></Card>
        ) : view === 'table' ? (
          <Card>
            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--primary-bg)] text-muted-foreground">
                    <th className="px-3 py-2 text-left w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        className="h-4 w-4"
                        checked={paged.length>0 && paged.every(p=>selectedIds.includes(p.id))}
                        onChange={(e)=>{
                          const ids = paged.map(p=>p.id)
                          const allSelected = ids.every(id=>selectedIds.includes(id))
                          setSelectedIds(prev => allSelected ? prev.filter(id=>!ids.includes(id)) : Array.from(new Set([...prev, ...ids])))
                        }}
                      />
                    </th>
                    <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>onSort('projectName')}>Project <span className="opacity-60">{sortBy==='projectName' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Progress</th>
                    <th className="px-3 py-2 text-left">Team</th>
                    <th className="px-3 py-2 text-left">Due Date</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(p => {
                    const sKey = statusKey(p)
                    const tasks = p.tasksCount ?? (p.tasks?.length ?? 0)
                    const open = (p as any).openTasksCount ?? 0
                    const progress = tasks > 0 ? Math.max(0, Math.min(100, Math.round(((tasks - open)/tasks)*100))) : 0
                    // team preview: names from project or fetched details
                    const namesFromProject = extractMemberNames(p)
                    const names = namesFromProject.length ? namesFromProject : (teamPreview[p.id] || [])
                    const initials = names.slice(0,3).map(n => n.split(' ').map(x=>x[0]).join('').toUpperCase())
                    const totalMembers = (p.membersCount != null ? p.membersCount : names.length)
                    const overflow = Math.max(0, totalMembers - initials.length)
                    const due = (p as any).endDate || (p as any).end_date || ''
                    const fmtDue = (()=>{ try { if (!due) return '—'; const d = new Date(due); return isNaN(d.getTime()) ? String(due) : d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) } catch { return '—' } })()

                    return (
                      <tr key={p.id} className="border-t border-[var(--border-color)] align-top">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            aria-label={`Select ${p.name}`}
                            className="h-4 w-4"
                            checked={selectedIds.includes(p.id)}
                            onChange={()=> setSelectedIds(prev => prev.includes(p.id) ? prev.filter(id=>id!==p.id) : [...prev, p.id])}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-start gap-2">
                            <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-blue-500"/>
                            <div>
                              <div className="font-medium text-foreground">{toTitle(p.name) || '—'}</div>
                              {p.description ? <div className="text-xs text-muted-foreground">{p.description.length>90 ? p.description.slice(0,90)+'…' : p.description}</div> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
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
                        </td>
                        <td className="px-3 py-2 min-w-[180px]">
                          <div className="text-xs mb-1">{progress}%</div>
                          <div className="h-2 w-full rounded bg-[var(--border-color)]">
                            <div className="h-2 rounded bg-blue-600" style={{ width: `${progress}%` }} />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex -space-x-2">
                            {initials.map((ch, idx) => (
                              <div key={idx} className="h-6 w-6 rounded-full bg-[var(--secondary-bg)] border border-[var(--border-color)] text-[10px] flex items-center justify-center text-foreground">
                                {ch}
                              </div>
                            ))}
                            {overflow > 0 && (
                              <div className="h-6 w-6 rounded-full bg-[var(--secondary-bg)] border border-[var(--border-color)] text-[10px] flex items-center justify-center text-muted-foreground">
                                +{overflow}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">{fmtDue}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" title="Open" onClick={()=>navigate(`/projects/${p.id}`)} leftIcon={<Eye className="h-4 w-4" />}>Open</Button>
                            <Button variant="outline" size="sm" title="Edit" onClick={()=>setEditProject(p)} leftIcon={<Pencil className="h-4 w-4" />}>Edit</Button>
                            <Button variant="outline" size="sm" title="Close" onClick={()=>handleCloseProject(p)} leftIcon={<CheckCircle className="h-4 w-4" />}>Close</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2 text-sm text-muted-foreground">
              <span>{(pageSafe-1)*rows + 1}-{Math.min(pageSafe*rows, filtered.length)} of {filtered.length}</span>
              <Button size="sm" variant="outline" disabled={pageSafe<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
              <Button size="sm" variant="outline" disabled={pageSafe>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(p => {
              const sKey = statusKey(p)
              const tasks = p.tasksCount ?? (p.tasks?.length ?? 0)
              const open = (p as any).openTasksCount ?? 0
              const progress = tasks > 0 ? Math.max(0, Math.min(100, Math.round(((tasks - open)/tasks)*100))) : 0
              const namesFromProject = extractMemberNames(p)
              const names = namesFromProject.length ? namesFromProject : (teamPreview[p.id] || [])
              const initials = names.slice(0,3).map(n => n.split(' ').map(x=>x[0]).join('').toUpperCase())
              const totalMembers = (p.membersCount != null ? p.membersCount : names.length)
              const overflow = Math.max(0, totalMembers - initials.length)
              const due = (p as any).endDate || (p as any).end_date || ''
              const fmtDue = (()=>{ try { if (!due) return '—'; const d = new Date(due); return isNaN(d.getTime()) ? String(due) : d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) } catch { return '—' } })()
              return (
                <Card key={p.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-semibold">{p.name || '—'}</div>
                      <div className="text-xs text-muted-foreground">Code: <span className="font-medium text-foreground">{p.projectCode || '—'}</span></div>
                      <div className="text-xs text-muted-foreground">Client: {p.client?.name || '—'}</div>
                      <div className="text-xs text-muted-foreground">Due: {fmtDue}</div>
                    </div>
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

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground font-medium">{progress}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded bg-[var(--border-color)]">
                      <div className="h-2 rounded bg-blue-600" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {initials.map((ch, idx) => (
                        <div key={idx} className="h-6 w-6 rounded-full bg-[var(--secondary-bg)] border border-[var(--border-color)] text-[10px] flex items-center justify-center text-foreground">
                          {ch}
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div className="h-6 w-6 rounded-full bg-[var(--secondary-bg)] border border-[var(--border-color)] text-[10px] flex items-center justify-center text-muted-foreground">
                          +{overflow}
                        </div>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] px-2 py-0.5 text-xs"><ListChecks className="h-3.5 w-3.5" /> {tasks} Tasks</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={()=>navigate(`/projects/${p.id}`)} leftIcon={<Eye className="h-4 w-4" />}>Open</Button>
                      <Button variant="outline" size="sm" onClick={()=>setEditProject(p)} leftIcon={<Pencil className="h-4 w-4" />}>Edit</Button>
                    </div>
                  </div>

                  {p.description ? <div className="mt-2 text-xs text-muted-foreground">{p.description.length>120 ? p.description.slice(0,120)+'…' : p.description}</div> : null}
                </Card>
              )
            })}
          </div>
        )}

        {/* Modals */}
        <EditProjectModal project={editProject} isOpen={!!editProject} onClose={()=>setEditProject(null)} onProjectUpdated={handleProjectUpdated} />
        <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={closeToast} />
        <AddProjectModal isOpen={showAdd} onClose={()=>setShowAdd(false)} onCreated={(p)=>{
          setShowAdd(false)
          // Reload list after creation
          setIsLoading(true)
          ProjectService.getProjects().then(d => setProjects(Array.isArray(d) ? d : [])).finally(()=>setIsLoading(false))
        }} />
      </div>
    </AppShell>
  )
}

