import React, { useEffect, useMemo, useState } from 'react';
import ProjectService, { Project } from '../services/project.service';
import ViewProjectModal from './projects/ViewProjectModal';
import EditProjectModal from './projects/EditProjectModal';
import AddProjectModal from './projects/AddProjectModal';

// Styles aligned with Clients list for consistency
const style = document.createElement('style');
style.textContent = `
  .page-wrap { background: var(--primary-bg); min-height: 100vh; }
  .toolbar { display:flex; gap:12px; align-items:center; }
  .search-input { width: 240px; padding: 0 10px; font-size: 14px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); border-radius: 6px; }
  .search-input::placeholder { color: var(--text-secondary); }
  .toggle-group { display:flex; gap:6px; }
  .toggle-btn { padding:0 12px; font-size:13px; border:1px solid var(--border-color); border-radius:6px; background:transparent; color:var(--text-secondary); }
  .toggle-btn.active { background: var(--accent-blue); border-color: var(--accent-blue); color:#fff; }
  .add-btn { padding: 0 14px; font-size: 14px; font-weight: 600; border-radius: 6px; border: 1px solid var(--accent-blue); background: var(--accent-blue); color: #fff; }
  .tabs { border-bottom:1px solid var(--border-color); margin-bottom:12px; }
  .tabs .tab { padding:8px 12px; border:1px solid transparent; border-top-left-radius:8px; border-top-right-radius:8px; color: var(--text-secondary); background: transparent; }
  .tabs .tab.active { color: var(--text-primary); background: var(--card-bg); border-color: var(--border-color); border-bottom-color: var(--card-bg); }

  /* Ensure form labels/headings are visible */
  .form-label { color: var(--text-primary) !important; font-weight: 600; }
  .field-inline { display:flex; align-items:center; gap:8px; }
  .inline-add { border:1px dashed var(--border-color); color: var(--accent-blue); background: transparent; border-radius:6px; padding:4px 8px; font-size:12px; font-weight:600; }
  .inline-add:hover { background: rgba(79,123,255,0.1); }

  .client-table-wrap { border:1px solid var(--border-color); border-radius:12px; overflow:hidden; background: var(--card-bg); }
  table.client-table { width:100%; border-collapse:collapse; }
  table.client-table thead th { font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:.02em; padding:12px; background: var(--primary-bg); color:var(--text-secondary); border-bottom:1px solid var(--border-color); position:sticky; top:0; z-index:1; }
  table.client-table tbody td { padding:12px; border-bottom:1px solid var(--border-color); color: var(--text-primary); vertical-align:middle; }
  table.client-table tbody tr:hover { background: rgba(255,255,255,0.02); }
  .actions { display:flex; gap:8px; }
  .icon-btn { width:32px; height:32px; border:1px solid var(--border-color); background:transparent; color:var(--text-secondary); border-radius:8px; display:flex; align-items:center; justify-content:center; }
  .icon-btn:hover { background: var(--accent-blue); color:#fff; border-color: var(--accent-blue); }
  .pill { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--border-color); border-radius:999px; padding:4px 10px; font-size:12px; color: var(--text-primary); }
  .badge { display:inline-block; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
  .badge-active{ background:#28a745; color:#fff; }
  .badge-inprogress{ background:var(--accent-blue); color:#fff; }
  .badge-onhold{ background:#ffc107; color:#212529; }
  .badge-blocked{ background:#dc3545; color:#fff; }
  .badge-archived{ background:#6c757d; color:#fff; }
  .badge-completed{ background:#28a745; color:#fff; filter:brightness(0.95); }

  .pagination { display:flex; gap:8px; align-items:center; justify-content:flex-end; padding:12px; }
  .pagination .pg-btn { border:1px solid var(--border-color); background:transparent; padding:6px 10px; border-radius:8px; }
  .pagination .pg-btn:disabled { opacity:.5; cursor:not-allowed; }
  .rows-select { border:1px solid var(--border-color); background:transparent; color:var(--text-primary); border-radius:8px; padding:6px 10px; }

  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:14px; }
  .card { background: var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; display:flex; gap:10px; flex-direction:column; }

  /* Centered modal overlay for quick-add */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index: 2000; }
  .modal-card { width:100%; max-width: 420px; background: var(--card-bg); color: var(--text-primary); border:1px solid var(--border-color); border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
  .modal-card .modal-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--border-color); }
  .modal-card .modal-body { padding:16px; }
  .modal-card .modal-footer { display:flex; gap:8px; justify-content:flex-end; padding:12px 16px; border-top:1px solid var(--border-color); }
  .btn-close { filter: invert(1); opacity:.7; }
`;
document.head.appendChild(style);

type SortKey = 'projectName' | 'projectCode' | 'clientName' | 'createdAt' | 'status' | 'members' | 'tasks';

const ProjectsContent: React.FC = () => {

// Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state like Clients
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);

// Modals
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);

  // (No create form state here; creation happens in AddProjectModal)

  useEffect(() => {
    (async () => {
      try {
        const data = await ProjectService.getProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Error fetching projects. Please try again later.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

// (Clients for create form are now loaded inside AddProjectModal when it opens)



  const statusKey = (p: Project): string => {
    const s = (p.status || (p.isActive ? 'active' : 'archived')).toString().toLowerCase();
    switch (s) {
      case 'active': return 'active';
      case 'in_progress':
      case 'in-progress':
      case 'progress': return 'inprogress';
      case 'on_hold':
      case 'on-hold': return 'onhold';
      case 'blocked': return 'blocked';
      case 'completed': return 'completed';
      case 'archived':
      default: return 'archived';
    }
  };

  const toTitle = (s?: string) => s ? s.replace(/\s+/g,' ').trim().split(' ').map(w=>w[0]?.toUpperCase()+w.slice(1)).join(' ') : '';
  const createdAt = (p: Project) => {
    const raw: any = (p as any).createdAt ?? (p as any).created_at;
    const d = raw ? new Date(raw) : null;
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—';
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = term
      ? projects.filter(p => [p.name, p.projectCode, p.client?.name]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(term)))
      : projects;

    const sorted = [...base].sort((a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const getVal = (p: Project, key: SortKey) => {
        switch(key){
          case 'projectName': return p.name || '';
          case 'projectCode': return p.projectCode || '';
          case 'clientName': return p.client?.name || '';
          case 'createdAt': return new Date((p as any).createdAt ?? (p as any).created_at ?? 0).getTime();
          case 'status': return statusKey(p);
          case 'members': return (p.membersCount ?? (p.teamMembers?.length ?? 0));
          case 'tasks': return (p.tasksCount ?? (p.tasks?.length ?? 0));
        }
      };
      const va:any = getVal(a, sortBy); const vb:any = getVal(b, sortBy);
      if (va < vb) return -1*dir; if (va > vb) return 1*dir; return 0;
    });
    return sorted;
  }, [projects, q, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rows));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((pageSafe-1)*rows, (pageSafe-1)*rows + rows), [filtered, pageSafe, rows]);

  const onSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  const handleProjectUpdated = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
  };

  const handleCloseProject = async (p: Project) => {
    const sKey = statusKey(p);
    if (sKey === 'completed') return;

    const tasksCount = p.tasksCount ?? (p.tasks?.length ?? 0);
    const openTasks = p.openTasksCount ?? (tasksCount > 0 ? tasksCount : 0); // fallback

    // If no tasks OR no open tasks -> close silently (no prompts)
    if (tasksCount === 0 || openTasks === 0) {
      try {
        await ProjectService.closeProject(p.id);
        setProjects(prev => prev.map(x => x.id === p.id ? { ...x, status: 'completed' } as Project : x));
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to close project';
        setError(msg);
      }
      return;
    }

    // There are open tasks -> confirm before attempting
    if (!window.confirm(`This project has ${openTasks} open task(s). You can only close a project when all tasks are completed. Do you want to try closing anyway?`)) return;
    try {
      await ProjectService.closeProject(p.id);
      setProjects(prev => prev.map(x => x.id === p.id ? { ...x, status: 'completed' } as Project : x));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to close project';
      setError(msg);
    }
  };

  return (
    <div className="container-fluid px-4 py-4 page-wrap">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold" style={{ color: 'var(--text-primary)' }}>Projects</h2>
        <div className="toolbar">
          <input className="search-input" placeholder="Search projects…" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(1); }} />
          <div className="toggle-group" role="tablist" aria-label="View switch">
            <button className={`toggle-btn ${view==='table'?'active':''}`} onClick={()=>setView('table')} title="Table view">Table</button>
            <button className={`toggle-btn ${view==='grid'?'active':''}`} onClick={()=>setView('grid')} title="Grid view">Grid</button>
          </div>
          <button className="add-btn" onClick={()=>setShowAddProject(true)}><i className="fas fa-plus"/> Add New Project</button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : projects.length === 0 ? (
        <div className="alert alert-info">No projects found. Click “Add New Project”.</div>
      ) : view === 'table' ? (
        <>
          <div className="client-table-wrap">
            <table className="client-table">
              <thead>
                <tr>
                  <th onClick={()=>onSort('projectName')}>Project <span className="arrow">{sortBy==='projectName'?(sortDir==='asc'?'▲':'▼'):''}</span></th>
                  <th onClick={()=>onSort('projectCode')}>Code <span className="arrow">{sortBy==='projectCode'?(sortDir==='asc'?'▲':'▼'):''}</span></th>
                  <th onClick={()=>onSort('clientName')}>Client <span className="arrow">{sortBy==='clientName'?(sortDir==='asc'?'▲':'▼'):''}</span></th>
                  <th onClick={()=>onSort('createdAt')}>Created <span className="arrow">{sortBy==='createdAt'?(sortDir==='asc'?'▲':'▼'):''}</span></th>
                  <th onClick={()=>onSort('members')}>Members <span className="arrow">{sortBy==='members'?(sortDir==='asc'?'▲':'▼'):''}</span></th>
                  <th onClick={()=>onSort('tasks')}>Tasks <span className="arrow">{sortBy==='tasks'?(sortDir==='asc'?'▲':'▼'):''}</span></th>
                  <th onClick={()=>onSort('status')}>Status <span className="arrow">{sortBy==='status'?(sortDir==='asc'?'▲':'▼'):''}</span></th>
                  <th style={{width:120}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(p => {
                  const members = p.membersCount ?? (p.teamMembers?.length ?? 0);
                  const tasks = p.tasksCount ?? (p.tasks?.length ?? 0);
                  const sKey = statusKey(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="fw-semibold">{toTitle(p.name) || '—'}</div>
                        {p.description ? <div className="text-muted small">{p.description.length>70? p.description.slice(0,70)+'…': p.description}</div> : null}
                      </td>
                      <td>{p.projectCode || '—'}</td>
                      <td>{p.client?.name || '—'}</td>
                      <td>{createdAt(p)}</td>
                      <td><span className="pill"><i className="fas fa-users"/> {members}</span></td>
                      <td><span className="pill"><i className="fas fa-tasks"/> {tasks}</span></td>
                      <td>
                        <span className={`badge badge-${sKey}`}>{sKey.replace('inprogress','IN PROGRESS').replace(/\b\w/g,c=>c.toUpperCase())}</span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="icon-btn" title="View" onClick={()=>setViewProject(p)}><i className="fas fa-eye"/></button>
                          <button className="icon-btn" title="Edit" onClick={()=>setEditProject(p)}><i className="fas fa-edit"/></button>
                          <button className="icon-btn" title="Close Project" onClick={()=>handleCloseProject(p)} disabled={statusKey(p)==='completed'}>
                            <i className="fas fa-check-circle"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        <div className="grid">
          {filtered.map(p => {
            const members = p.membersCount ?? (p.teamMembers?.length ?? 0);
            const tasks = p.tasksCount ?? (p.tasks?.length ?? 0);
            const sKey = statusKey(p);
            return (
              <div className="card" key={p.id}>
                <div className="d-flex justify-content-between align-items-start">
                  <h5>{p.name || '—'}</h5>
                  <span className={`badge badge-${sKey}`}>{sKey.replace('inprogress','IN PROGRESS').replace(/\b\w/g,c=>c.toUpperCase())}</span>
                </div>
                <div className="text-muted" style={{fontSize:12}}>Code: <strong>{p.projectCode || '—'}</strong></div>
                <div className="text-muted" style={{fontSize:12}}>Client: {p.client?.name || '—'}</div>
                <div className="text-muted" style={{fontSize:12}}>Created: {createdAt(p)}</div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span className="pill"><i className="fas fa-users"/> {members} Members</span>
                  <span className="pill"><i className="fas fa-tasks"/> {tasks} Tasks</span>
                  <div className="actions">
                    <button className="icon-btn" title="View" onClick={()=>setViewProject(p)}><i className="fas fa-eye"/></button>
                    <button className="icon-btn" title="Edit" onClick={()=>setEditProject(p)}><i className="fas fa-edit"/></button>
                    <button className="icon-btn" title="Close Project" onClick={()=>handleCloseProject(p)} disabled={statusKey(p)==='completed'}>
                      <i className="fas fa-check-circle"/>
                    </button>
                  </div>
                </div>
                {p.description ? <div className="text-muted small">{p.description.length>90? p.description.slice(0,90)+'…': p.description}</div> : null}
              </div>
            );
          })}
        </div>
      )}

      <ViewProjectModal project={viewProject} isOpen={!!viewProject} onClose={()=>setViewProject(null)} />
      <EditProjectModal project={editProject} isOpen={!!editProject} onClose={()=>setEditProject(null)} onProjectUpdated={handleProjectUpdated} />

      <AddProjectModal
        isOpen={showAddProject}
        onClose={()=>setShowAddProject(false)}
        onCreated={async()=>{
          try{
            setIsLoading(true);
            const data = await ProjectService.getProjects();
            setProjects(Array.isArray(data) ? data : []);
          } finally {
            setIsLoading(false);
            setShowAddProject(false);
          }
        }}
      />
    </div>
  );
};

export default ProjectsContent;
