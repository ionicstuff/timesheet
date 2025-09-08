import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Search, Users, Mail, CheckCircle, Clock, AlertCircle, Eye, Plus } from 'lucide-react'
import ProjectService from '../services/project.service'
import UserService from '../services/user.service'
import TaskService from '../services/task.service'
import AddTaskModal from '../components/AddTaskModal'
import InviteMemberModal from '../components/InviteMemberModal'

interface Member {
  id: number
  name: string
  role: string
  email: string
  status: 'online'|'away'|'offline'
  tasks: number
}

interface Project { id: number; projectName?: string; name?: string }
interface Task { id: number; title?: string; name?: string; assignedTo?: number | null }

const DUMMY_MEMBERS: Member[] = [
  { id: 1, name: 'Alex Johnson', role: 'Project Manager', email: 'alex@example.com', status: 'online', tasks: 12 },
  { id: 2, name: 'Sam Smith', role: 'Designer', email: 'sam@example.com', status: 'online', tasks: 8 },
  { id: 3, name: 'Taylor Brown', role: 'Developer', email: 'taylor@example.com', status: 'away', tasks: 15 },
  { id: 4, name: 'Jordan Lee', role: 'Marketing', email: 'jordan@example.com', status: 'offline', tasks: 5 },
]

export default function TeamsNew() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')

  const [members, setMembers] = useState<Member[]>(DUMMY_MEMBERS)
  const DUMMY_PROJECTS: Project[] = [
    { id: 0, projectName: 'Demo Project Alpha', name: 'Demo Project Alpha' },
    { id: -1, projectName: 'Demo Project Beta', name: 'Demo Project Beta' }
  ]

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | ''>('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [preselectedAssigneeId, setPreselectedAssigneeId] = useState<number | undefined>(undefined)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return members.filter(m => {
      const matchQ = !term || [m.name, m.email, m.role].some(v => v.toLowerCase().includes(term))
      const matchRole = !role || m.role.toLowerCase() === role.toLowerCase()
      const matchStatus = !status || m.status === status
      return matchQ && matchRole && matchStatus
    })
  }, [q, role, status, members])

  const statusDot = (s: Member['status']) => (
    <span className={[
      'inline-block h-2.5 w-2.5 rounded-full',
      s==='online' ? 'bg-green-500' : s==='away' ? 'bg-yellow-500' : 'bg-slate-400'
    ].join(' ')} />
  )
  const statusLabel = (s: Member['status']) => s.charAt(0).toUpperCase() + s.slice(1)
  const initials = (name: string) => name.split(' ').map(n=>n[0]).join('').toUpperCase()

  // load team members and projects on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [team, myProjects] = await Promise.all([
          // Use axios services so Authorization header is included
          UserService.getMyTeamMembers().catch(()=>[]),
          ProjectService.getMyProjects().catch(()=>[])
        ])

        if (Array.isArray(team) && team.length) {
          const mapped: Member[] = team.map((u: any) => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            role: u.designation || 'Member',
            email: u.email,
            status: 'online', // no real-time status available; default to online
            tasks: 0
          }))
          setMembers(mapped)
        }

        if (Array.isArray(myProjects) && myProjects.length) {
          setProjects(myProjects.map((p:any)=>({ id: p.id, projectName: p.name, name: p.name })))
        } else {
          // fallback so the UI isn't empty (useful in dev)
          setProjects(DUMMY_PROJECTS)
        }
      } catch (err) {
        console.error('Failed to load team/projects', err)
        // ensure dropdown isn't empty in case of any error
        setProjects(prev => prev.length ? prev : DUMMY_PROJECTS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // open Add Task in response to header event
  useEffect(() => {
    const handler = () => {
      if (!selectedProject) {
        window.alert('Please select a project first');
        return;
      }
      setPreselectedAssigneeId(undefined)
      setShowAddTask(true)
    }
    // @ts-ignore - custom event name
    window.addEventListener('app:new-task', handler as any)
    return () => {
      // @ts-ignore
      window.removeEventListener('app:new-task', handler as any)
    }
  }, [selectedProject])

  // load tasks when project selection changes
  useEffect(() => {
    if (!selectedProject) {
      setTasks([])
      return
    }

    let mounted = true
    const loadTasks = async () => {
      try {
        setLoading(true)
        const arr = await TaskService.getTasksByProject(Number(selectedProject)).catch((e)=>{
          // handle 401/403 gracefully for non-manager roles
          return [] as any[]
        })
        if (!mounted) return
        setTasks(arr as any)
      } catch (err) {
        console.error('Failed to load tasks', err)
        setTasks([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadTasks()
    return () => { mounted = false }
  }, [selectedProject])

  const assignTask = async (taskId: number, memberId: number, confirmOverwrite = false) => {
    try {
      // Try assigning; if 409, prompt and retry with confirmOverwrite=true
      try {
        await TaskService.assignTask(taskId, { assignedTo: memberId, confirmOverwrite })
      } catch (e: any) {
        const status = e?.response?.status
        const msg = e?.response?.data?.message || e?.message
        if (status === 409) {
          const ok = window.confirm(msg || 'Task already assigned. Overwrite?')
          if (ok) return assignTask(taskId, memberId, true)
          return
        }
        window.alert(msg || 'Failed to assign task')
        return
      }

      window.alert('Task assigned')
      // refresh tasks for the project
      if (selectedProject) {
        try {
          const arr = await TaskService.getTasksByProject(Number(selectedProject))
          setTasks(arr as any)
        } catch {}
      }
      // Optionally, update member task counts locally
    } catch (err) {
      console.error('Assign failed', err)
      window.alert('Assign failed')
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-3xl font-bold">Team</h1>
          </div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} className="bg-black text-white hover:bg-gray-900" onClick={() => {
            if (!selectedProject) { window.alert('Please select a project first'); return; }
            setPreselectedAssigneeId(undefined); setShowInvite(true);
          }}>
            Invite Member
          </Button>
        </div> 

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input placeholder="Search team members..." value={q} onChange={(e)=>setQ(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <select className="h-10 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={role} onChange={(e)=>setRole(e.target.value)}>
            <option value="">All Roles</option>
            <option>Project Manager</option>
            <option>Designer</option>
            <option>Developer</option>
            <option>Marketing</option>
          </select>
          <select className="h-10 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="online">Online</option>
            <option value="away">Away</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm">Project:</label>
          <select className="h-9 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={selectedProject} onChange={(e)=>setSelectedProject(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Select project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.projectName || p.name || `Project ${p.id}`}</option>)}
          </select>
          {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        </div>

        <Card>
          <div className="rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-[var(--border-color)]">
              <thead className="bg-background border-b border-[var(--border-color)]">
                <tr className="text-sm text-left">
                  <th className="px-4 py-4">Members</th>
                  <th className="px-4 py-4">Roles</th>
                  <th className="px-4 py-4">Tasks</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Assign Task</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[var(--border-color)]">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-[var(--secondary-bg)] cursor-pointer" onClick={() => navigate(`/teams/${m.id}`)}>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="relative">
                          <div className="h-9 w-9 rounded-full bg-[var(--secondary-bg)] border border-[var(--border-color)] flex items-center justify-center text-[10px]">{initials(m.name)}</div>
                          <span className="absolute -bottom-0 -right-0">{statusDot(m.status)}</span>
                        </div>
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">{m.role}</td>
                    <td className="px-4 py-4 align-top text-sm"><span className="font-medium">{m.tasks}</span></td>
                    <td className="px-4 py-4 align-top text-sm">
                      <span className={['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', m.status==='online'?'bg-green-100 text-green-800': m.status==='away'?'bg-yellow-100 text-yellow-800':'bg-gray-100 text-gray-800'].join(' ')}>
                        {statusLabel(m.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      {selectedProject ? (
                        <div className="flex items-center gap-2">
                          <select className="h-8 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" onClick={(e)=>e.stopPropagation()} onChange={(e)=>{ e.stopPropagation(); const val = e.target.value; if(val) assignTask(Number(val), m.id) }}>
                            <option value="">Assign...</option>
                            {tasks.map(t => (
                              <option key={t.id} value={t.id}>{(t.title || t.name) + (t.assignedTo? ' (assigned)' : '')}</option>
                            ))}
                          </select>
                          <button className="h-8 px-2 rounded-md border border-[var(--border-color)] text-xs" title="Create and assign new task" onClick={(e)=>{ e.stopPropagation(); if(!selectedProject){ window.alert('Select a project first'); return; } setPreselectedAssigneeId(m.id); setShowAddTask(true); }}>+ New</button>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Select a project to assign</div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-sm text-muted-foreground">No members match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {showAddTask && selectedProject && (
        <AddTaskModal
          show={showAddTask}
          onHide={()=> setShowAddTask(false)}
          projectId={Number(selectedProject)}
          preselectedAssigneeId={preselectedAssigneeId}
          onTaskCreated={async ()=>{
            // reload tasks for current project
            try {
              const arr = await TaskService.getTasksByProject(Number(selectedProject))
              setTasks(arr as any)
            } catch {}
          }}
        />
      )}
      {showInvite && selectedProject && (
        <InviteMemberModal
          show={showInvite}
          onClose={()=> setShowInvite(false)}
          projectId={Number(selectedProject)}
          projectName={(projects.find(p=>p.id===selectedProject) as any)?.projectName || (projects.find(p=>p.id===selectedProject) as any)?.name}
          onAdded={async ()=>{
            try {
              const arr = await TaskService.getTasksByProject(Number(selectedProject))
              setTasks(arr as any)
            } catch {}
          }}
          preselectedAssigneeId={preselectedAssigneeId}
        />
      )}
    </AppShell>
  )
}
