import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { Plus, Search, Eye, Pencil } from 'lucide-react'
import ClientService, { Client } from '../services/client.service'
import AddClientModal from '../components/AddClientModal'
import EditClientModal from '../components/EditClientModal'
import Toast from '../components/Toast'


type SortKey = 'clientName' | 'clientCode' | 'companyName' | 'createdAt' | 'status' | 'projects'

export default function ClientsNew() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [sortBy, setSortBy] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(10)

  // Filters
  const [industries, setIndustries] = useState<string[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      try {
        const inds = await ClientService.getIndustries().catch(() => [])
        setIndustries(Array.isArray(inds) ? inds : [])
      } catch {}
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true)
        const data = await ClientService.getUserClients({
          search: q || undefined,
          industry: selectedIndustry || undefined,
          status: selectedStatus || undefined,
        })
        setClients(Array.isArray(data) ? data : [])
        setError(null)
      } catch (e: any) {
        setError(e?.message || 'Error fetching clients')
      } finally { setIsLoading(false) }
    })()
  }, [q, selectedIndustry, selectedStatus])

  const toTitleCase = (str?: string) => str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''
  const fmtDate = (c: Client) => {
    const raw: any = (c as any).createdAt ?? (c as any).created_at
    const d = raw ? new Date(raw) : null
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—'
  }

  const filtered = useMemo(() => {
    const sorted = [...clients].sort((a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const getVal = (c: Client, key: SortKey) => {
        if (key === 'projects') return (c.projects?.length ?? 0)
        if (key === 'createdAt') return new Date((c as any).createdAt ?? (c as any).created_at ?? 0).getTime()
        return (c as any)[key] ?? ''
      }
      const va: any = getVal(a, sortBy)
      const vb: any = getVal(b, sortBy)
      if (va < vb) return -1 * dir
      if (va > vb) return  1 * dir
      return 0
    })
    return sorted
  }, [clients, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rows))
  const pageSafe = Math.min(page, totalPages)
  const paged = useMemo(() => filtered.slice((pageSafe-1)*rows, (pageSafe-1)*rows + rows), [filtered, pageSafe, rows])
  const onSort = (key: SortKey) => { if (sortBy === key) setSortDir(d => d==='asc'?'desc':'asc'); else { setSortBy(key); setSortDir('asc') } }

  const handleEditClient = (client: Client) => { setSelectedClient(client); setEditModalOpen(true) }
  const handleCloseEditModal = () => { setEditModalOpen(false); setSelectedClient(null) }
  const [toast, setToast] = useState<{ message: string; type: 'success'|'error'|'warning'|'info'; isVisible: boolean }>({ message: '', type: 'info', isVisible: false })
  const closeToast = () => setToast(p=>({ ...p, isVisible: false }))
  const handleClientUpdated = (updated: Client) => { setClients(prev => prev.map(c => c.id === updated.id ? updated : c)); setToast({ message: 'Client updated', type: 'success', isVisible: true }) }

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Heading */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Clients</h1>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={()=>setShowAddModal(true)}>Add Client</Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="w-64"><Input placeholder="Search clients…" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(1) }} leftIcon={<Search className="h-4 w-4" />} /></div>
            <select className="h-9 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={selectedIndustry} onChange={(e)=>{ setSelectedIndustry(e.target.value); setPage(1) }}>
              <option value="">All Industries</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
            <select className="h-9 rounded-md border border-[var(--border-color)] bg-background px-2 text-sm text-foreground" value={selectedStatus} onChange={(e)=>{ setSelectedStatus(e.target.value); setPage(1) }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
              <option value="closed">Closed</option>
            </select>
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
          <Card><div className="py-10 text-center text-sm text-muted-foreground">Loading clients…</div></Card>
        ) : error ? (
          <Card><div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div></Card>
        ) : clients.length === 0 ? (
          <Card><div className="py-10 text-center text-sm text-muted-foreground">No clients found. Click “Add Client”.</div></Card>
        ) : view === 'table' ? (
          <Card>
            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--primary-bg)] text-muted-foreground">
                    <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>onSort('clientName')}>Client <span className="opacity-60">{sortBy==='clientName' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                    <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>onSort('clientCode')}>Code <span className="opacity-60">{sortBy==='clientCode' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                    <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>onSort('companyName')}>Company <span className="opacity-60">{sortBy==='companyName' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                    <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>onSort('createdAt')}>Created <span className="opacity-60">{sortBy==='createdAt' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                    <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>onSort('projects')}>Projects <span className="opacity-60">{sortBy==='projects' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                    <th className="px-3 py-2 text-left cursor-pointer" onClick={()=>onSort('status')}>Status <span className="opacity-60">{sortBy==='status' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(c => (
                    <tr key={c.id} className="border-t border-[var(--border-color)]">
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-foreground">{toTitleCase(c.clientName) || '—'}</div>
                        {c.notes ? <div className="text-xs text-muted-foreground">{c.notes.length>90 ? c.notes.slice(0,90)+'…' : c.notes}</div> : null}
                      </td>
                      <td className="px-3 py-2 align-top">{c.clientCode || '—'}</td>
                      <td className="px-3 py-2 align-top">{c.companyName || '—'}</td>
                      <td className="px-3 py-2 align-top">{fmtDate(c)}</td>
                      <td className="px-3 py-2 align-top"><span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] px-2 py-0.5 text-xs">{c.projects?.length ?? 0}</span></td>
                      <td className="px-3 py-2 align-top">
                        <span className={[
                          'inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                          String(c.status).toLowerCase()==='active' ? 'bg-green-500/15 text-green-600' : 'bg-slate-500/15 text-slate-600'
                        ].join(' ')}>
                          {String(c.status || '').toUpperCase() || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" title="Open" onClick={()=>navigate(`/clients/${c.id}`)} leftIcon={<Eye className="h-4 w-4" />}>Open</Button>
                          <Button variant="outline" size="sm" title="Edit" onClick={()=>handleEditClient(c)} leftIcon={<Pencil className="h-4 w-4" />}>Edit</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
            {filtered.map(c => (
              <Card key={c.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-semibold">{c.clientName || '—'}</div>
                    <div className="text-xs text-muted-foreground">Code: <span className="font-medium text-foreground">{c.clientCode || '—'}</span></div>
                    <div className="text-xs text-muted-foreground">Company: {c.companyName || '—'}</div>
                    <div className="text-xs text-muted-foreground">Created: {fmtDate(c)}</div>
                  </div>
                  <span className={[
                    'inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                    String(c.status).toLowerCase()==='active' ? 'bg-green-500/15 text-green-600' : 'bg-slate-500/15 text-slate-600'
                  ].join(' ')}>
                    {String(c.status || '').toUpperCase() || '—'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Projects: <span className="text-foreground font-medium">{c.projects?.length ?? 0}</span></span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={()=>navigate(`/clients/${c.id}`)} leftIcon={<Eye className="h-4 w-4" />}>Open</Button>
                    <Button variant="outline" size="sm" onClick={()=>handleEditClient(c)} leftIcon={<Pencil className="h-4 w-4" />}>Edit</Button>
                  </div>
                </div>
                {c.notes ? <div className="mt-2 text-xs text-muted-foreground">{c.notes.length>120 ? c.notes.slice(0,120)+'…' : c.notes}</div> : null}
              </Card>
            ))}
          </div>
        )}

        {/* Modals */}
        <EditClientModal client={selectedClient} isOpen={editModalOpen} onClose={handleCloseEditModal} onClientUpdated={handleClientUpdated} />
        <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={closeToast} />
        <AddClientModal isOpen={showAddModal} onClose={()=>setShowAddModal(false)} onCreated={async ()=>{
          setShowAddModal(false)
          setIsLoading(true)
          try {
            const data = await ClientService.getUserClients({ search: q || undefined, industry: selectedIndustry || undefined, status: selectedStatus || undefined })
            setClients(Array.isArray(data) ? data : [])
          } finally { setIsLoading(false) }
        }} />
      </div>
    </AppShell>
  )
}

