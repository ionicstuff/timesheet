import React, { useEffect, useState } from 'react'
import AppShell from '../layouts/AppShell'
import Card from '../ui/Card'
import Button from '../ui/Button'
import TimesheetService, { TimesheetStatus } from '../services/timesheet.service'
import TimesheetEntryService, { TimesheetEntry } from '../services/timesheetEntry.service'
import ProjectService from '../services/project.service'
import taskService from '../services/task.service'
import Toast from '../components/Toast'
import { LogIn, LogOut, Calendar, Plus, Clock, Trash2, Edit3, Save, X } from 'lucide-react'

function fmtDate(d: Date) { return d.toISOString().slice(0,10) }

export default function TimesheetNew() {
  const [status, setStatus] = useState<TimesheetStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [date, setDate] = useState<string>(fmtDate(new Date()))
  const [entries, setEntries] = useState<TimesheetEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add-entry form state
  const [projects, setProjects] = useState<any[]>([])
  const [projectTasks, setProjectTasks] = useState<any[]>([])
  const [projectFilter, setProjectFilter] = useState('')
  const [taskFilter, setTaskFilter] = useState('')
  const [addForm, setAddForm] = useState<{ projectId: number; taskId?: number | null; minutes: string; isBillable: boolean; description: string }>({ projectId: 0, taskId: 0, minutes: '', isBillable: true, description: '' })
  const [addLoading, setAddLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success'|'error'|'warning'|'info'; isVisible: boolean }>({ message: '', type: 'info', isVisible: false })
  const closeToast = () => setToast(prev => ({ ...prev, isVisible: false }))

  // Edit inline state
  const [editId, setEditId] = useState<number | null>(null)
  const [editMinutes, setEditMinutes] = useState<string>('')
  const [editBillable, setEditBillable] = useState<boolean>(true)
  const [editDescription, setEditDescription] = useState<string>('')

  // Submission lock (disable edits when submitted)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const s = await TimesheetService.getTimesheetStatus()
      setStatus(s)
      const l = await TimesheetEntryService.list(date)
      setEntries(Array.isArray(l?.entries) ? l.entries : [])
      // If backend returns a submission indicator, guard edits; otherwise preserve local state
      if ((l as any)?.submitted === true || (l as any)?.locked === true) setIsSubmitted(true)
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load timesheet')
    } finally { setLoading(false) }
  }

  useEffect(() => { setIsSubmitted(false); load() }, [date])

  // Cache tasks for projects that appear in the entries list (for displaying task names)
  const [tasksMap, setTasksMap] = useState<Record<number, any[]>>({})
  useEffect(() => {
    const missing = Array.from(new Set((entries||[]).map(e => e.projectId))).filter(pid => pid && !tasksMap[pid])
    if (missing.length === 0) return
    ;(async () => {
      const results = await Promise.all(missing.map(async (pid) => {
        try { const list = await taskService.getTasksByProject(pid); return [pid, Array.isArray(list)?list:[]] as const } catch { return [pid, []] as const }
      }))
      setTasksMap(prev => {
        const next = { ...prev }
        results.forEach(([pid, list]) => { next[pid] = list })
        return next
      })
    })()
  }, [entries, tasksMap])

  useEffect(() => {
    // load projects once
    (async () => {
      try {
        const list = await ProjectService.getProjects()
        setProjects(Array.isArray(list) ? list : [])
      } catch {}
    })()
  }, [])

  useEffect(() => {
    // fetch tasks when project changes in add form
    (async () => {
      if (!addForm.projectId) { setProjectTasks([]); return }
      try {
        const t = await taskService.getTasksByProject(addForm.projectId)
        setProjectTasks(Array.isArray(t) ? t : [])
      } catch { setProjectTasks([]) }
    })()
  }, [addForm.projectId])

  const toggleClock = async () => {
    if (!status) return
    setBusy(true)
    try {
      if (status.status === 'clocked_in') await TimesheetService.clockOut(); else await TimesheetService.clockIn()
      setStatus(await TimesheetService.getTimesheetStatus())
      setToast({ message: status.status==='clocked_in' ? 'Clocked out' : 'Clocked in', type: 'success', isVisible: true })
    } catch (e: any) {
      setToast({ message: e?.message || 'Failed to toggle clock', type: 'error', isVisible: true })
    } finally { setBusy(false) }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const minutesNum = Number(addForm.minutes)
    if (!addForm.projectId || !minutesNum || minutesNum <= 0) { setError('Please select a project and enter minutes > 0'); return }
    setAddLoading(true)
    try {
      await TimesheetEntryService.create({
        date,
        projectId: addForm.projectId,
        taskId: addForm.taskId ? Number(addForm.taskId) : undefined,
        minutes: minutesNum,
        isBillable: addForm.isBillable,
        description: addForm.description || undefined,
      })
      // reset
      setAddForm({ projectId: 0, taskId: 0, minutes: '', isBillable: true, description: '' })
      setProjectTasks([])
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to add entry')
    } finally { setAddLoading(false) }
    setToast({ message: 'Entry added', type: 'success', isVisible: true })
  }

  const startEdit = (en: TimesheetEntry) => {
    setEditId(en.id)
    setEditMinutes(String(en.minutes))
    setEditBillable(!!en.isBillable)
    setEditDescription(en.description || '')
  }
  const cancelEdit = () => { setEditId(null); setEditMinutes(''); setEditBillable(true); setEditDescription('') }
  const saveEdit = async (en: TimesheetEntry) => {
    const minutesNum = Number(editMinutes)
    if (!minutesNum || minutesNum <= 0) { setError('Minutes must be > 0'); return }
    try {
      await TimesheetEntryService.update(en.id, { minutes: minutesNum, isBillable: editBillable, description: editDescription })
      cancelEdit()
      await load()
      setToast({ message: 'Entry updated', type: 'success', isVisible: true })
    } catch (e: any) { setError(e?.message || 'Failed to update entry') }
  }
  const deleteEntry = async (en: TimesheetEntry) => {
    if (!window.confirm('Delete this entry?')) return
    try { await TimesheetEntryService.remove(en.id); await load(); setToast({ message: 'Entry deleted', type: 'success', isVisible: true }) } catch (e: any) { setError(e?.message || 'Failed to delete entry') }
  }

  const submitDay = async () => {
    try { await TimesheetEntryService.submitDay(date); setIsSubmitted(true); await load(); setToast({ message: 'Day submitted', type: 'success', isVisible: true }) } catch (e: any) { setError(e?.message || 'Failed to submit day') }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Timesheet</h1>
          <div className="flex items-center gap-2">
            <input type="date" className="h-9 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={date} onChange={(e)=>setDate(e.target.value)} />
            <Button variant="outline" onClick={submitDay}>Submit Day</Button>
            <Button variant={status?.status==='clocked_in'?'danger':'success'} onClick={toggleClock} loading={busy} leftIcon={status?.status==='clocked_in'?<LogOut className="h-4 w-4" />:<LogIn className="h-4 w-4" />}>{status?.status==='clocked_in'?'Clock Out':'Clock In'}</Button>
          </div>
        </div>

        {loading ? (
          <Card><div className="py-10 text-center text-sm text-muted-foreground">Loading…</div></Card>
        ) : error ? (
          <Card><div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div></Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="mt-1 text-sm">{status?.status?.replace('_',' ') || '—'}</div>
              </Card>
              <Card>
                <div className="text-xs text-muted-foreground">Clock In</div>
                <div className="mt-1 text-sm">{(status?.clockInTime) || '--:--'}</div>
              </Card>
              <Card>
                <div className="text-xs text-muted-foreground">Clock Out</div>
                <div className="mt-1 text-sm">{(status?.clockOutTime) || '--:--'}</div>
              </Card>
            </div>

            {/* Add Entry */}
            <Card title="Add Entry">
              <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Project</div>
                  <input className="mb-1 h-8 w-full rounded-md border border-[var(--border-color)] bg-background px-2 text-xs text-foreground" placeholder="Search projects…" value={projectFilter} onChange={(e)=>setProjectFilter(e.target.value)} />
                  <select className="h-9 w-full rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={addForm.projectId} onChange={(e)=>{ const v=Number(e.target.value)||0; setAddForm(f=>({ ...f, projectId: v, taskId: 0 })); setTaskFilter('') }} required disabled={isSubmitted}>
                    <option value={0}>Select Project</option>
                    {projects.filter((p:any)=>{
                      const q = projectFilter.trim().toLowerCase();
                      if (!q) return true;
                      const label = `${p.projectCode||''} ${p.name||p.projectName||''}`.toLowerCase();
                      return label.includes(q);
                    }).map((p:any)=> <option key={p.id} value={p.id}>{p.projectCode || p.name || p.projectName}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Task (optional)</div>
                  <input className="mb-1 h-8 w-full rounded-md border border-[var(--border-color)] bg-background px-2 text-xs text-foreground" placeholder="Search tasks…" value={taskFilter} onChange={(e)=>setTaskFilter(e.target.value)} disabled={!addForm.projectId || projectTasks.length===0} />
                  <select className="h-9 w-full rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={addForm.taskId||0} onChange={(e)=>setAddForm(f=>({ ...f, taskId: Number(e.target.value)||0 }))} disabled={!addForm.projectId || projectTasks.length===0 || isSubmitted}>
                    <option value={0}>—</option>
                    {projectTasks.filter((t:any)=>{
                      const q = taskFilter.trim().toLowerCase();
                      if (!q) return true;
                      return String(t.name||'').toLowerCase().includes(q);
                    }).map((t:any)=> <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Minutes</div>
                  <input className="h-9 w-full rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" type="number" min={1} step={1} value={addForm.minutes} onChange={(e)=>setAddForm(f=>({ ...f, minutes: e.target.value }))} required disabled={isSubmitted} />
                </div>
                <div className="flex items-center gap-2">
                  <input id="addBillable" type="checkbox" className="h-4 w-4" checked={addForm.isBillable} onChange={(e)=>setAddForm(f=>({ ...f, isBillable: e.target.checked }))} disabled={isSubmitted} />
                  <label htmlFor="addBillable" className="text-sm">Billable</label>
                </div>
                <div className="md:col-span-5">
                  <div className="text-xs text-muted-foreground mb-1">Description</div>
                  <input className="h-9 w-full rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" placeholder="Optional" value={addForm.description} onChange={(e)=>setAddForm(f=>({ ...f, description: e.target.value }))} disabled={isSubmitted} />
                </div>
                <div className="md:col-span-5">
                  <Button type="submit" loading={addLoading} leftIcon={<Plus className="h-4 w-4" />} disabled={isSubmitted}>Add Entry</Button>
                </div>
              </form>
              {isSubmitted && (<div className="mt-2 text-xs text-muted-foreground">This day has been submitted. Editing and adding entries are disabled.</div>)}
            </Card>

            <Card title="Entries">
              {entries.length === 0 ? (
                <div className="text-sm text-muted-foreground">No entries for {date}.</div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full table-auto border-collapse text-sm">
                    <thead>
                      <tr className="bg-[var(--primary-bg)] text-muted-foreground">
                        <th className="px-3 py-2 text-left">Project</th>
                        <th className="px-3 py-2 text-left">Task</th>
                        <th className="px-3 py-2 text-left">Minutes</th>
                        <th className="px-3 py-2 text-left">Billable</th>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-left">Actions</th>
                        <th className="px-3 py-2 text-left">Minutes</th>
                        <th className="px-3 py-2 text-left">Billable</th>
                        <th className="px-3 py-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map(en => (
                        <tr key={en.id} className="border-t border-[var(--border-color)]">
                          <td className="px-3 py-2">{(() => { const p = projects.find((p:any)=>p.id===en.projectId); return p ? (p.projectCode || p.name || p.projectName || en.projectId) : en.projectId })()}</td>
                          <td className="px-3 py-2">{(() => { if (!en.taskId) return '—'; const list = tasksMap[en.projectId]||[]; const t = list.find((t:any)=>t.id===en.taskId); return t?.name || en.taskId })()}</td>
                          <td className="px-3 py-2">
                            {editId===en.id ? (
                              <input className="h-9 w-24 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" type="number" min={1} step={1} value={editMinutes} onChange={(e)=>setEditMinutes(e.target.value)} />
                            ) : (
                              en.minutes
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {editId===en.id ? (
                              <input id={`bill-${en.id}`} type="checkbox" className="h-4 w-4" checked={editBillable} onChange={(e)=>setEditBillable(e.target.checked)} />
                            ) : (
                              en.isBillable ? 'Yes' : 'No'
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {editId===en.id ? (
                              <input className="h-9 w-full rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={editDescription} onChange={(e)=>setEditDescription(e.target.value)} />
                            ) : (
                              en.description || '—'
                            )}
                          </td>
                          <td className="px-3 py-2 w-48">
                            {isSubmitted ? (
                              <div className="text-xs text-muted-foreground">Locked</div>
                            ) : editId===en.id ? (
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="success" leftIcon={<Save className="h-4 w-4" />} onClick={()=>saveEdit(en)}>Save</Button>
                                <Button size="sm" variant="outline" leftIcon={<X className="h-4 w-4" />} onClick={cancelEdit}>Cancel</Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" leftIcon={<Edit3 className="h-4 w-4" />} onClick={()=>startEdit(en)}>Edit</Button>
                                <Button size="sm" variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={()=>deleteEntry(en)}>Delete</Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={closeToast} />
    </AppShell>
  )
}

