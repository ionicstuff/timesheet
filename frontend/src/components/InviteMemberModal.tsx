import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import UserService from '../services/user.service';
import TaskService from '../services/task.service';

interface InviteMemberModalProps {
  show: boolean;
  onClose: () => void;
  projectId: number;
  projectName?: string;
  onAdded: () => void;
  preselectedAssigneeId?: number;
}

export default function InviteMemberModal({ show, onClose, projectId, projectName, onAdded, preselectedAssigneeId }: InviteMemberModalProps) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(preselectedAssigneeId ?? null);

  useEffect(() => {
    if (!show) return;
    setSelectedUserId(preselectedAssigneeId ?? null);
    if (q.trim().length >= 2) void search(q.trim());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, projectId, preselectedAssigneeId]);

  const canSearch = useMemo(() => q.trim().length >= 2, [q]);

  const search = async (term: string) => {
    try {
      setLoading(true);
      setError(null);
      const arr = await UserService.searchUsers({ q: term, limit: 20, page: 1 });
      setResults(arr);
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedUserId) return;
    try {
      setLoading(true);
      setError(null);
      await TaskService.createTask({
        projectId,
        name: `Onboard to ${projectName || 'Project'}`,
        description: `Auto-generated onboarding task to add to project ${projectName || projectId}`,
        assignedTo: selectedUserId,
        estimatedTime: 1
      });
      onAdded();
      onClose();
      setQ('');
      setResults([]);
      setSelectedUserId(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to invite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [show, onClose]);

  if (!show) return null;

  const node = (
    <div
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2050, display: 'grid', placeItems: 'center', padding: '24px' }}
      onClick={onClose}
    >
      <div onClick={(e)=>e.stopPropagation()} style={{ width: 'min(680px,92vw)', maxHeight: '90vh', background:'var(--card-bg)', color:'var(--text-primary)', border:'1px solid var(--border-color)', borderRadius:16, boxShadow:'0 16px 40px rgba(0,0,0,.35)', overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', background:'var(--secondary-bg)', borderBottom:'1px solid var(--border-color)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h5 style={{ margin:0, fontWeight:700 }}>Invite Member</h5>
          <button className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
        <div style={{ padding:16 }}>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="mb-3">
            <label className="form-label">Search users</label>
            <input
              type="text"
              className="form-control"
              placeholder="Type a name or email... (min 2 chars)"
              value={q}
              onChange={(e)=>{ setQ(e.target.value); if (e.target.value.trim().length>=2) search(e.target.value.trim()); }}
              style={{ background:'var(--secondary-bg)', color:'var(--text-primary)', borderColor:'var(--border-color)' }}
            />
          </div>
          <div style={{ maxHeight: 280, overflow:'auto', border:'1px solid var(--border-color)', borderRadius:8 }}>
            {loading ? (
              <div className="p-3 text-muted" style={{ fontSize: 13 }}>Searching…</div>
            ) : !canSearch ? (
              <div className="p-3 text-muted" style={{ fontSize: 13 }}>Enter at least 2 characters to search.</div>
            ) : results.length === 0 ? (
              <div className="p-3 text-muted" style={{ fontSize: 13 }}>No results</div>
            ) : (
              <ul className="list-group list-group-flush">
                {results.map(u => (
                  <li key={u.id} className="list-group-item d-flex align-items-center" style={{ cursor:'pointer', background: selectedUserId===u.id ? 'var(--hover-bg)' : 'transparent' }} onClick={()=>setSelectedUserId(u.id)}>
                    <span className="badge rounded-circle me-2 d-inline-flex align-items-center justify-content-center" style={{ width: 28, height: 28, background: 'var(--accent-blue)', color: '#fff' }}>
                      <i className="fas fa-user" />
                    </span>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{u.firstName || u.firstname} {u.lastName || u.lastname}</div>
                      <small className="text-muted">{u.email}{u.department ? ` • ${u.department}` : ''}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleInvite} disabled={!selectedUserId || loading}>{loading ? 'Inviting…' : 'Invite'}</button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

