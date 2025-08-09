import React, { useEffect, useMemo, useState } from 'react';
import ClientService, { Client } from '../services/client.service';
import EditClientModal from './EditClientModal';

// ---- Light, self-contained styles (kept inline like your current file) ----
const style = document.createElement('style');
style.textContent = `
  .page-wrap { background: var(--primary-bg); min-height: 100vh; }
  .toolbar { display:flex; gap:12px; align-items:center; }
  .toolbar .search { max-width: 340px; }
  .view-toggle button { border:1px solid var(--border-color); background:transparent; padding:6px 10px; border-radius:8px; }
  .view-toggle .active { background: var(--card-bg); }
  .add-btn { background: var(--accent-blue); color:#fff; border:1px solid var(--accent-blue); border-radius:8px; padding:10px 16px; font-weight:600; }
  .add-btn:hover { filter:brightness(1.05); }

  /* Table */
  .client-table-wrap { border:1px solid var(--border-color); border-radius:12px; overflow:hidden; background: var(--card-bg); }
  table.client-table { width:100%; border-collapse:collapse; }
  table.client-table thead th { font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:.02em; padding:12px; background: var(--primary-bg); color:var(--text-secondary); border-bottom:1px solid var(--border-color); position:sticky; top:0; z-index:1; }
  table.client-table tbody td { padding:12px; border-bottom:1px solid var(--border-color); color: var(--text-primary); vertical-align:middle; }
  table.client-table tbody tr:hover { background: rgba(255,255,255,0.02); }
  .sortable { cursor:pointer; user-select:none; }
  .sortable .arrow { opacity:.5; margin-left:6px; font-size:11px; }
  .badge { display:inline-block; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
  .badge-active { background:#28a745; color:#fff; }
  .badge-inactive { background:#6c757d; color:#fff; }
  .projects-pill { display:inline-block; border:1px solid var(--border-color); border-radius:999px; padding:4px 10px; font-size:12px; }
  .actions { display:flex; gap:8px; }
  .icon-btn { width:32px; height:32px; border:1px solid var(--border-color); background:transparent; color:var(--text-secondary); border-radius:8px; display:flex; align-items:center; justify-content:center; }
  .icon-btn:hover { background: var(--accent-blue); color:#fff; border-color: var(--accent-blue); }

  /* Pagination */
  .pagination { display:flex; gap:8px; align-items:center; justify-content:flex-end; padding:12px; }
  .pagination .pg-btn { border:1px solid var(--border-color); background:transparent; padding:6px 10px; border-radius:8px; }
  .pagination .pg-btn:disabled { opacity:.5; cursor:not-allowed; }
  .rows-select { border:1px solid var(--border-color); background:transparent; color:var(--text-primary); border-radius:8px; padding:6px 10px; }

  /* Optional grid view (kept, but cleaner) */
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:14px; }
  .card { background: var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; display:flex; gap:10px; flex-direction:column; }
  .card h5 { margin:0; font-size:16px; color:var(--text-primary); }
  .card .meta { color: var(--text-secondary); font-size:12px; }

  .toolbar { display:flex; gap:10px; align-items:center; }
  .toolbar > * { height:36px; }

  .search-input {
    width: 240px;
    padding: 0 10px;
    font-size: 14px;
    border: 1px solid var(--border-color);
    background: var(--card-bg);
    color: var(--text-primary);
    border-radius: 6px;
  }
  .search-input::placeholder { color: var(--text-secondary); }

  .toggle-group {
    display:flex; gap:6px;
    background: transparent;
    padding: 0; border: 0;
  }
  .toggle-btn {
    padding: 0 12px;
    font-size: 13px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: transparent;
    color: var(--text-secondary);
    display:flex; align-items:center; justify-content:center;
  }
  .toggle-btn.active {
    background: var(--accent-blue);
    border-color: var(--accent-blue);
    color: #fff;
  }

  .add-btn {
    padding: 0 14px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid var(--accent-blue);
    background: var(--accent-blue);
    color: #fff;
  }
  .add-btn i { margin-right: 6px; }
  
`;
document.head.appendChild(style);

// ---- Component ----
interface ClientsProps { onNavigateToOnboard: () => void; }

type SortKey = 'clientName' | 'clientCode' | 'companyName' | 'createdAt' | 'status' | 'projects';

const Clients: React.FC<ClientsProps> = ({ onNavigateToOnboard }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'table' | 'grid'>('table');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const toTitleCase = (str?: string) =>
  str
    ? str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';

  useEffect(() => {
    (async () => {
      try {
        const data = await ClientService.getUserClients();
        setClients(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Error fetching clients. Please try again later.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = term
      ? clients.filter(c =>
          [c.clientName, c.clientCode, c.companyName]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(term))
        )
      : clients;

    const sorted = [...base].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;

      const getVal = (c: Client, key: SortKey) => {
        if (key === 'projects') return (c.projects?.length ?? 0);
        if (key === 'createdAt') return new Date((c as any).createdAt ?? (c as any).created_at ?? 0).getTime();
        return (c as any)[key] ?? '';
      };

      const va = getVal(a, sortBy);
      const vb = getVal(b, sortBy);

      if (va < vb) return -1 * dir;
      if (va > vb) return  1 * dir;
      return 0;
    });

    return sorted;
  }, [clients, q, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rows));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((pageSafe - 1) * rows, (pageSafe - 1) * rows + rows),
    [filtered, pageSafe, rows]
  );

  const onSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const fmtDate = (c: Client) => {
    const raw = (c as any).createdAt ?? (c as any).created_at;
    const d = raw ? new Date(raw) : null;
    return d && !isNaN(d.getTime())
      ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';
  };

  // Edit handlers
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedClient(null);
  };

  const handleClientUpdated = (updatedClient: Client) => {
    // Update the client in the local state
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    );
  };

  return (
    <div className="container-fluid px-4 py-4 page-wrap">
      <div className="d-flex justify-content-between align-items-center mb-3">
  <h2 className="fw-bold" style={{ color: 'var(--text-primary)' }}>My Clients</h2>

  <div className="toolbar">
    <input
      className="search-input"
      placeholder="Search clients…"
      value={q}
      onChange={(e) => { setQ(e.target.value); setPage?.(1); }}
    />

    <div className="toggle-group" role="tablist" aria-label="View switch">
      <button
        className={`toggle-btn ${view === 'table' ? 'active' : ''}`}
        onClick={() => setView('table')}
        title="Table view"
      >
        Table
      </button>
      <button
        className={`toggle-btn ${view === 'grid' ? 'active' : ''}`}
        onClick={() => setView('grid')}
        title="Grid view"
      >
        Grid
      </button>
    </div>

    <button className="add-btn" onClick={onNavigateToOnboard}>
      <i className="fas fa-plus" /> Add New Client
    </button>
  </div>
</div>


      {isLoading ? (
        <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : clients.length === 0 ? (
        <div className="alert alert-info">No clients found. Click “Add New Client”.</div>
      ) : view === 'table' ? (
        <>
          <div className="client-table-wrap">
            <table className="client-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => onSort('clientName')}>Client <span className="arrow">{sortBy==='clientName' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                  <th className="sortable" onClick={() => onSort('clientCode')}>Code <span className="arrow">{sortBy==='clientCode' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                  <th className="sortable" onClick={() => onSort('companyName')}>Company <span className="arrow">{sortBy==='companyName' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                  <th className="sortable" onClick={() => onSort('createdAt')}>Created <span className="arrow">{sortBy==='createdAt' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                  <th className="sortable" onClick={() => onSort('projects')}>Projects <span className="arrow">{sortBy==='projects' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                  <th className="sortable" onClick={() => onSort('status')}>Status <span className="arrow">{sortBy==='status' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                  <th style={{width: 120}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="fw-semibold">{toTitleCase(c.clientName) || '—'}</div>
                      {c.notes ? <div className="text-muted small">{c.notes.length > 70 ? c.notes.slice(0, 70) + '…' : c.notes}</div> : null}
                    </td>
                    <td>{c.clientCode || '—'}</td>
                    <td>{c.companyName || '—'}</td>
                    <td>{fmtDate(c)}</td>
                    <td><span className="projects-pill">{c.projects?.length ?? 0}</span></td>
                    <td>
                      <span className={`badge ${String(c.status).toLowerCase() === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                        {String(c.status || '').toUpperCase() || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn" title="View"><i className="fas fa-eye"/></button>
                        <button className="icon-btn" title="Edit" onClick={() => handleEditClient(c)}><i className="fas fa-edit"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="pagination">
              <span className="text-muted small">Rows:</span>
              <select className="rows-select" value={rows} onChange={(e)=>{ setRows(Number(e.target.value)); setPage(1); }}>
                {[10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-muted small ms-2">{(pageSafe-1)*rows + 1}-{Math.min(pageSafe*rows, filtered.length)} of {filtered.length}</span>
              <button className="pg-btn" disabled={pageSafe<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
              <button className="pg-btn" disabled={pageSafe>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
            </div>
          </div>
        </>
      ) : (
        // Optional Grid view for quick visual scan (tidier than before)
        <div className="grid">
          {filtered.map(c => (
            <div className="card" key={c.id}>
              <div className="d-flex justify-content-between align-items-start">
                <h5>{c.clientName || '—'}</h5>
                <span className={`badge ${String(c.status).toLowerCase()==='active' ? 'badge-active' : 'badge-inactive'}`}>
                  {String(c.status || '').toUpperCase() || '—'}
                </span>
              </div>
              <div className="meta">Code: <strong>{c.clientCode || '—'}</strong></div>
              {c.companyName ? <div className="meta">Company: {c.companyName}</div> : null}
              <div className="meta">Created: {fmtDate(c)}</div>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="projects-pill">{c.projects?.length ?? 0} Projects</span>
                <div className="actions">
                  <button className="icon-btn" title="View"><i className="fas fa-eye"/></button>
                  <button className="icon-btn" title="Edit" onClick={() => handleEditClient(c)}><i className="fas fa-edit"/></button>
                </div>
              </div>
              {c.notes ? <div className="text-muted small">{c.notes.length > 90 ? c.notes.slice(0, 90) + '…' : c.notes}</div> : null}
            </div>
          ))}
        </div>
      )}

      {/* Edit Client Modal */}
      <EditClientModal
        client={selectedClient}
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  );
};

export default Clients;
