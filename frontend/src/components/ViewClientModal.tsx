import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Client } from '../services/client.service';

interface ViewClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

const ensureModalStyles = () => {
  const styleId = 'view-client-modal-styles';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index: 2000; }
    .modal-card { width:100%; max-width: 640px; background: var(--card-bg); color: var(--text-primary); border:1px solid var(--border-color); border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
    .modal-card .modal-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--border-color); }
    .modal-card .modal-body { padding:16px; }
    .modal-card .modal-footer { display:flex; gap:8px; justify-content:flex-end; padding:12px 16px; border-top:1px solid var(--border-color); }
    .btn-close { filter: invert(1); opacity:.7; }
    .kv { display:grid; grid-template-columns: 160px 1fr; gap:10px; }
    .kv .key { color: var(--text-secondary); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    .kv .val { color: var(--text-primary); }
    .badge { display:inline-block; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
    .badge-active { background:#28a745; color:#fff; }
    .badge-inactive { background:#6c757d; color:#fff; }
  `;
  document.head.appendChild(style);
};

const ViewClientModal: React.FC<ViewClientModalProps> = ({ client, isOpen, onClose }) => {
  useEffect(() => { ensureModalStyles(); }, []);
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onEsc); };
  }, [isOpen, onClose]);

  if (!isOpen || !client) return null;

  const createdAt = (() => {
    const raw: any = (client as any).createdAt ?? (client as any).created_at;
    const d = raw ? new Date(raw) : null;
    return d && !isNaN(d.getTime()) ? d.toLocaleString() : '—';
  })();

  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="view-client-title" onClick={(e)=>{ if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <h5 id="view-client-title" className="mb-0">Client Details</h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <div className="kv">
            <div className="key">Name</div>
            <div className="val">{client.clientName || '—'}</div>

            <div className="key">Code</div>
            <div className="val">{client.clientCode || '—'}</div>

            <div className="key">Company</div>
            <div className="val">{client.companyName || '—'}</div>

            <div className="key">Status</div>
            <div className="val">
              <span className={`badge ${String(client.status).toLowerCase()==='active' ? 'badge-active' : 'badge-inactive'}`}>{String(client.status || '').toUpperCase() || '—'}</span>
            </div>

            <div className="key">Industry</div>
            <div className="val">{client.industry || '—'}</div>

            <div className="key">Account Manager</div>
            <div className="val">{client.accountManager ? `${client.accountManager.firstName} ${client.accountManager.lastName} (${client.accountManager.email})` : '—'}</div>

            <div className="key">Created</div>
            <div className="val">{createdAt}</div>

            <div className="key">Projects</div>
            <div className="val">{client.projects?.length ?? 0}</div>
          </div>

          {client.notes ? (
            <div className="mt-3">
              <div className="key" style={{ marginBottom: 6 }}>Notes</div>
              <div className="val">{client.notes}</div>
            </div>
          ) : null}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ViewClientModal;

