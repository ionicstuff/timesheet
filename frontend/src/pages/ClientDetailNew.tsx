import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import Card from '../ui/Card'
import Button from '../ui/Button'
import ClientService, { Client } from '../services/client.service'
import EditClientModal from '../components/EditClientModal'
import Toast from '../components/Toast'
import { Building2, Users, Folder, BadgeCheck, Pencil, Plus, Eye } from 'lucide-react'

export default function ClientDetailNew() {
  const { id } = useParams()
  const clientId = Number(id)
  const navigate = useNavigate()

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success'|'error'|'warning'|'info'; isVisible: boolean }>({ message: '', type: 'info', isVisible: false })
  const closeToast = () => setToast(p=>({ ...p, isVisible: false }))

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      try {
        const c = await ClientService.getClientById(clientId)
        if (alive) setClient(c)
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load client')
      } finally { if (alive) setLoading(false) }
    }
    if (clientId) load(); else { setError('Invalid client id'); setLoading(false) }
    return () => { alive = false }
  }, [clientId])

  const projects = (client?.projects || []) as any[]
  const statusKey = (s?: string) => (s || '').toLowerCase() === 'active' ? 'active' : 'inactive'

  if (loading) return <AppShell><div className="p-4 text-sm text-muted-foreground">Loading client…</div></AppShell>
  if (error) return <AppShell><div className="p-4"><div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div></div></AppShell>
  if (!client) return <AppShell><div className="p-4 text-sm text-muted-foreground">Client not found.</div></AppShell>

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold">{client.clientName || '—'}</h1>
              <span className={[ 'inline-block rounded-full px-2 py-0.5 text-xs font-semibold', statusKey(client.status)==='active' ? 'bg-green-500/15 text-green-700' : 'bg-slate-500/15 text-slate-700' ].join(' ')}>
                {(client.status || 'INACTIVE').toString().toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Code: <span className="text-foreground font-medium">{client.clientCode || '—'}</span>{client.companyName ? ` • ${client.companyName}` : ''}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={()=>setEditOpen(true)}>Edit Client</Button>
          </div>
        </div>

        {/* Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-4 w-4" /> Account Manager</div>
            <div className="mt-2 text-sm">{client.accountManager ? `${(client.accountManager as any).firstName} ${(client.accountManager as any).lastName}` : '—'}</div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Folder className="h-4 w-4" /> Projects</div>
            <div className="mt-2 text-2xl font-semibold">{projects.length}</div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><BadgeCheck className="h-4 w-4" /> Status</div>
            <div className="mt-2 text-sm">{(client.status || '').toString().toUpperCase()}</div>
          </Card>
        </div>

        {/* Projects list */}
        <Card title="Projects">
          {projects.length === 0 ? (
            <div className="text-sm text-muted-foreground">No projects for this client.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p:any)=> (
                <div key={p.id} className="rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">{p.projectName || p.name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{p.status || ''}</div>
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />} onClick={()=>navigate(`/projects/${p.id}`)}>Open</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notes */}
        {client.notes ? (
          <Card title="Notes">
            <div className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</div>
          </Card>
        ) : null}
      </div>

      <EditClientModal
        client={client as any}
        isOpen={editOpen}
        onClose={()=> setEditOpen(false)}
        onClientUpdated={(updated)=>{
          setClient(prev => prev && prev.id === updated.id ? (updated as any) : updated)
          setEditOpen(false)
          setToast({ message: 'Client updated', type: 'success', isVisible: true })
        }}
      />
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={closeToast} />
    </AppShell>
  )
}
