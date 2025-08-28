import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ClientService, { Client } from '../services/client.service';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
}

// Inject minimal, theme-aligned modal styles (centered)
const ensureModalStyles = () => {
  const styleId = 'add-client-modal-styles';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index: 2000; }
    .modal-card { width:100%; max-width: 520px; background: var(--card-bg); color: var(--text-primary); border:1px solid var(--border-color); border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
    .modal-card .modal-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--border-color); }
    .modal-card .modal-body { padding:16px; }
    .modal-card .modal-footer { display:flex; gap:8px; justify-content:flex-end; padding:12px 16px; border-top:1px solid var(--border-color); }
    .btn-close { filter: invert(1); opacity:.7; }
    .form-control, .form-select { background: var(--secondary-bg); border:1px solid var(--border-color); color: var(--text-primary); }
    .form-control::placeholder { color: var(--text-secondary); }
    .btn-primary { background: var(--accent-blue); border-color: var(--accent-blue); }
  `;
  document.head.appendChild(style);
};

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [clientName, setClientName] = useState('');
  const [spocEmail, setSpocEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { ensureModalStyles(); }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 0);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', onEsc);
      return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onEsc); };
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) { setError('Client name is required'); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await ClientService.createClient({
        clientName: clientName.trim(),
        spocEmail: spocEmail.trim() || undefined,
        status: 'active',
        currency: 'USD',
        notes: notes.trim() || undefined,
      });
      onCreated(created);
      setClientName(''); setSpocEmail(''); setNotes('');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create client';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-client-title" onClick={(e)=>{ if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <h5 id="add-client-title" className="mb-0">Add New Client</h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <div className="mb-3">
              <label className="form-label">Client Name</label>
              <input ref={firstInputRef} type="text" className="form-control" placeholder="Enter client name" value={clientName} onChange={(e)=>setClientName(e.target.value)} required />
            </div>

            <div className="mb-3">
              <label className="form-label">SPOC Email <span className="text-muted" style={{ fontSize: 12 }}>(Optional)</span></label>
              <input type="email" className="form-control" placeholder="name@example.com" value={spocEmail} onChange={(e)=>setSpocEmail(e.target.value)} />
            </div>

            <div className="mb-0">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={4} placeholder="Any relevant notes" value={notes} onChange={(e)=>setNotes(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2" role="status"/>Creating...</> : <>Create Client</>}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddClientModal;

