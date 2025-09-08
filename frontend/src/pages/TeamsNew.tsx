import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Search, Users, Mail, Plus } from 'lucide-react'
import UserService from '../services/user.service'

interface Member {
  id: number
  name: string
  role: string
  email: string
  status: 'online'|'away'|'offline'
  tasks: number
}

export default function TeamsNew() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        setLoading(true)
        const team = await UserService.getMyTeamMembers({ includeSubordinates: true, limit: 200 })
        if (!alive) return
        const mapped: Member[] = team.map(u => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          role: u.designation || '—',
          email: u.email,
          status: 'online',
          tasks: 0,
        }))
        setMembers(mapped)
        setError(null)
      } catch (e: any) {
        if (!alive) return
        setError(e?.response?.data?.message || e?.message || 'Failed to load team')
        setMembers([])
      } finally { if (alive) setLoading(false) }
    }
    load()
    return () => { alive = false }
  }, [q])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return members.filter(m => {
      const matchQ = !term || [m.name, m.email, m.role].some(v => v.toLowerCase().includes(term))
      const matchRole = !role || m.role.toLowerCase() === role.toLowerCase()
      const matchStatus = !status || m.status === status
      return matchQ && matchRole && matchStatus
    })
  }, [members, q, role, status])

  const statusDot = (s: Member['status']) => (
    <span className={[
      'inline-block h-2.5 w-2.5 rounded-full',
      s==='online' ? 'bg-green-500' : s==='away' ? 'bg-yellow-500' : 'bg-slate-400'
    ].join(' ')} />
  )
  const statusLabel = (s: Member['status']) => s.charAt(0).toUpperCase() + s.slice(1)
  const initials = (name: string) => name.split(' ').map(n=>n[0]).join('').toUpperCase()

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-3xl font-bold">Team</h1>
          </div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} className="bg-black text-white hover:bg-gray-900">
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

        <Card>
          <div className="rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-[var(--border-color)]">
              <thead className="bg-background border-b border-[var(--border-color)]">
                <tr className="text-sm text-left">
                  <th className="px-4 py-4">Members</th>
                  <th className="px-4 py-4">Roles</th>
                  <th className="px-4 py-4">Tasks</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[var(--border-color)]">
                {loading && (
                  <tr><td colSpan={4} className="p-6 text-sm text-muted-foreground">Loading team…</td></tr>
                )}
                {error && !loading && (
                  <tr><td colSpan={4} className="p-6 text-sm text-red-600">{error}</td></tr>
                )}
                {!loading && !error && filtered.map(m => (
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
                  </tr>
                ))}
                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-sm text-muted-foreground">No members match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
