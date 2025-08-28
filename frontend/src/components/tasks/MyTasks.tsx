import React, { useEffect, useState } from 'react';
import taskService, { Task } from '../../services/task.service';
import AddMyTaskModal from './AddMyTaskModal';
import Toast from '../Toast';

// Inject theme-aligned styles for My Tasks
const style = document.createElement('style');
style.textContent = `
  .page-wrap { background: var(--primary-bg); min-height: 100vh; }
  .toolbar { display:flex; gap:12px; align-items:center; }
  .status-select { border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); border-radius:8px; height:36px; }
  .status-select:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 0.2rem rgba(79,123,255,0.25); }
  .add-btn { padding: 0 14px; font-size: 14px; font-weight: 600; border-radius: 6px; border: 1px solid var(--accent-blue); background: var(--accent-blue); color: #fff; }
  .toggle-group { display:flex; gap:6px; }
  .toggle-btn { padding:0 12px; font-size:13px; border:1px solid var(--border-color); border-radius:6px; background:transparent; color:var(--text-secondary); }
  .toggle-btn.active { background: var(--accent-blue); border-color: var(--accent-blue); color:#fff; }

  .task-table-wrap { border:1px solid var(--border-color); border-radius:12px; overflow:hidden; background: var(--card-bg); }
  table.task-table { width:100%; border-collapse:collapse; }
  table.task-table thead th { font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:.02em; padding:12px; background: var(--primary-bg); color:var(--text-secondary); border-bottom:1px solid var(--border-color); position:sticky; top:0; z-index:1; }
  table.task-table tbody td { padding:12px; border-bottom:1px solid var(--border-color); color: var(--text-primary); vertical-align:middle; }
  table.task-table tbody tr:hover { background: rgba(255,255,255,0.02); }

  /* Board */
  .board { display:grid; grid-template-columns: repeat(4, minmax(240px, 1fr)); gap:12px; }
  .column { background: var(--card-bg); border:1px solid var(--border-color); border-radius:12px; display:flex; flex-direction:column; min-height: 280px; }
  .column-header { padding:12px; border-bottom:1px solid var(--border-color); font-weight:700; color: var(--text-primary); display:flex; align-items:center; justify-content:space-between; }
  .column-body { padding:12px; display:flex; flex-direction:column; gap:8px; min-height: 200px; }
  .column-body.hover { outline: 2px dashed var(--accent-blue); outline-offset: -6px; }
  .task-card { background: var(--primary-bg); border:1px solid var(--border-color); color: var(--text-primary); border-radius:10px; padding:8px; cursor:grab; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
  .task-card:active { cursor:grabbing; }
  .task-meta { font-size:12px; color: var(--text-secondary); }

  .badge { display:inline-block; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
  .badge-pending { background: var(--border-color); color: var(--text-secondary); }
  .badge-inprogress { background: var(--accent-blue); color:#fff; }
  .badge-paused { background:#ffc107; color:#212529; }
  .badge-completed { background:#28a745; color:#fff; }
`;
document.head.appendChild(style);

const formatMinutes = (seconds?: number) => {
  const s = Math.floor((seconds || 0) / 60);
  const h = Math.floor(s / 60);
  const m = s % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<'table'|'board'>('table');
  const [hoverCol, setHoverCol] = useState<''|'pending'|'in_progress'|'paused'|'completed'>('');
  const [movingId, setMovingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; isVisible: boolean }>({ message: '', type: 'info', isVisible: false });
  const handleToastClose = () => setToast(prev => ({ ...prev, isVisible: false }));

  const load = async () => {
    try {
      setLoading(true);
      const data = await taskService.getMyTasks(status ? { status } : undefined);
      setTasks(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const run = async (id: number, op: 'start'|'pause'|'resume'|'stop'|'complete') => {
    try {
      setActionLoading(id);
      const api = {
        start: () => taskService.start(id),
        pause: () => taskService.pause(id),
        resume: () => taskService.resume(id),
        stop: () => taskService.stop(id),
        complete: () => taskService.complete(id)
      }[op];
      await api();
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || `Failed to ${op} task`;
      setToast({ message: msg, type: 'error', isVisible: true });
    } finally {
      setActionLoading(null);
    }
  };

  const statusKey = (s?: string) => {
    const raw = (s || '').toLowerCase();
    switch (raw) {
      case 'in_progress':
      case 'in-progress':
      case 'progress': return 'inprogress';
      case 'paused': return 'paused';
      case 'completed': return 'completed';
      case 'pending':
      default: return 'pending';
    }
  };
  const statusLabel = (s?: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—';

  return (
    <div className="container-fluid px-4 py-4 page-wrap">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>My Tasks</h2>
        <div className="toolbar">
          <div className="toggle-group" role="tablist" aria-label="View switch">
            <button className={`toggle-btn ${view==='table'?'active':''}`} onClick={()=>setView('table')} title="Table view">Table</button>
            <button className={`toggle-btn ${view==='board'?'active':''}`} onClick={()=>setView('board')} title="Board view">Kanban</button>
          </div>
          <select className="status-select" style={{ width: 200 }} value={status} onChange={(e)=>setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
          <button className="add-btn" onClick={()=>setShowAdd(true)}>
            <i className="fas fa-plus"/> Add Task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: 'var(--accent-blue)' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="alert alert-info">No tasks found.</div>
      ) : (
        view === 'table' ? (
        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Tracked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const isRunning = t.status === 'in_progress' && (t as any).activeTimerStartedAt;
                const sKey = statusKey(t.status);
                return (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.project?.projectCode || t.project?.projectName || t.projectId}</td>
                    <td>
                      <span className={`badge badge-${sKey}`}>{statusLabel(t.status)}</span>
                    </td>
                    <td>{formatMinutes((t as any).totalTrackedSeconds)}</td>
                    <td>
                      {t.status === 'pending' || t.status === 'paused' ? (
                        <button disabled={actionLoading===t.id} className="btn btn-sm btn-primary me-2" onClick={()=>run(t.id!, 'start')}>Start</button>
                      ) : null}
                      {isRunning ? (
                        <>
                          <button disabled={actionLoading===t.id} className="btn btn-sm btn-warning me-2" onClick={()=>run(t.id!, 'pause')}>Pause</button>
                          <button disabled={actionLoading===t.id} className="btn btn-sm btn-secondary me-2" onClick={()=>run(t.id!, 'stop')}>Stop</button>
                        </>
                      ) : null}
                      {t.status === 'paused' ? (
                        <button disabled={actionLoading===t.id} className="btn btn-sm btn-success me-2" onClick={()=>run(t.id!, 'resume')}>Resume</button>
                      ) : null}
                      <button disabled={actionLoading===t.id} className="btn btn-sm btn-outline-success" onClick={()=>run(t.id!, 'complete')}>Complete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        ) : (
        <div className="board">
          {['pending','in_progress','paused','completed'].map((col) => {
            const key = col as 'pending'|'in_progress'|'paused'|'completed';
            const title = key === 'in_progress' ? 'In Progress' : key.charAt(0).toUpperCase() + key.slice(1).replace('_',' ');
            const colTasks = tasks.filter(t => t.status === key);
            return (
              <div key={key} className="column">
                <div className="column-header">
                  <span>{title}</span>
                  <span className="text-muted small">{colTasks.length}</span>
                </div>
                <div
                  className={`column-body ${hoverCol===key?'hover':''}`}
                  onDragOver={(e)=>{ e.preventDefault(); }}
                  onDragEnter={()=>setHoverCol(key)}
                  onDragLeave={()=>setHoverCol('')}
                  onDrop={async (e)=>{
                    e.preventDefault();
                    setHoverCol('');
                    const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
                    if (!raw) return;
                    let payload: any; try { payload = JSON.parse(raw); } catch { return; }
                    const { id, status: from } = payload || {};
                    if (!id) return;
                    if (from === key) return; // no-op
                    setMovingId(id);
                    try {
                      if (key === 'in_progress') {
                        if (from === 'pending') await taskService.start(id);
                        else if (from === 'paused') await taskService.resume(id);
                        else throw new Error('Only Pending or Paused can move to In Progress');
                      } else if (key === 'paused') {
                        if (from === 'in_progress') await taskService.pause(id);
                        else throw new Error('Only In Progress can be paused');
                      } else if (key === 'completed') {
                        await taskService.complete(id);
                      } else if (key === 'pending') {
                        throw new Error('Cannot move tasks back to Pending');
                      }
                      await load();
                    } catch (err: any) {
                      const msg = err?.response?.data?.message || err?.message || 'Failed to move task';
                      setToast({ message: msg, type: 'error', isVisible: true });
                    } finally {
                      setMovingId(null);
                    }
                  }}
                >
                  {colTasks.map(t => {
                    const sKey = statusKey(t.status);
                    const isMoving = movingId === t.id;
                    return (
                      <div
                        key={t.id}
                        className="task-card"
                        draggable
                        onDragStart={(e)=>{
                          e.dataTransfer.setData('application/json', JSON.stringify({ id: t.id, status: t.status }));
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="fw-semibold">{t.name}</div>
                          <span className={`badge badge-${sKey}`}>{statusLabel(t.status)}</span>
                        </div>
                        <div className="task-meta">{t.project?.projectCode || t.project?.projectName || `Project #${t.projectId}`}</div>
                        <div className="task-meta">Tracked: {formatMinutes((t as any).totalTrackedSeconds)} · Est: {(t as any).estimatedTime ?? '—'}h</div>
                        {isMoving && (
                          <div className="text-muted small mt-1"><span className="spinner-border spinner-border-sm me-2"/>Updating…</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        )
      )}
      <AddMyTaskModal isOpen={showAdd} onClose={()=>setShowAdd(false)} onCreated={load} />
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={handleToastClose} />
    </div>
  );
};

export default MyTasks;

