import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import ProjectService, { Project } from '../../services/project.service';
import SpocService from '../../services/spoc.service';
import AddClientModal from '../AddClientModal';
import axios from 'axios';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState<number>(0);
  const [spocId, setSpocId] = useState<number>(0);
  const [endDate, setEndDate] = useState('');
  const [briefReceivedOn, setBriefReceivedOn] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  const [clients, setClients] = useState<Array<{ id:number; clientName:string }>>([]);
  const [spocs, setSpocs] = useState<Array<{ id:number; name:string; email:string }>>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick add modals
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddSpoc, setShowAddSpoc] = useState(false);
  const [newSpoc, setNewSpoc] = useState({ name: '', email: '' });
  const [isCreatingSpoc, setIsCreatingSpoc] = useState(false);

  // Load clients on open
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const resp = await axios.get('http://localhost:3000/api/client-management/all', { headers: { Authorization: `Bearer ${token}` } });
        setClients(resp.data.data || []);
      } catch (e) {
        console.error('Error loading clients for AddProjectModal', e);
      }
    })();
  }, [isOpen]);

  // Load SPOCs when client changes
  useEffect(() => {
    if (!clientId) { setSpocs([]); setSpocId(0); return; }
    SpocService.getByClient(clientId).then(setSpocs).catch(() => setSpocs([]));
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) { setError('Project name and client are required'); return; }
    setError(null);
    setIsLoading(true);
    try {
      const resp = await ProjectService.createProject({
        // Allow extra fields through cast
        ...( { name: name.trim(), clientId, spocId: spocId || undefined, endDate: endDate || undefined, briefReceivedOn: briefReceivedOn || undefined, estimatedTime: estimatedTime ? Number(estimatedTime) : undefined } as any )
      } as any);
      const created = resp?.project || resp; // service returns { message, project }
      onCreated(created as Project);
      // reset
      setName(''); setClientId(0); setSpocId(0); setEndDate(''); setBriefReceivedOn(''); setEstimatedTime('');
      setSpocs([]);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create project';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const afterClientCreated = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get('http://localhost:3000/api/client-management/all', { headers: { Authorization: `Bearer ${token}` } });
      const list = resp.data.data || [];
      setClients(list);
      // Optionally auto-select last (newest) client
      const newest = list[list.length - 1];
      if (newest?.id) setClientId(newest.id);
    } catch {}
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" size="lg">
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Project Name</label>
            <input type="text" className="form-control" value={name} onChange={(e)=>setName(e.target.value)} required />
          </div>

          <div className="mb-3">
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <label className="form-label mb-0">Client</label>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={()=>setShowAddClient(true)}>
                <i className="fas fa-plus"/> Add
              </button>
            </div>
            <select className="form-select" value={clientId} onChange={(e)=>setClientId(Number(e.target.value))} required>
              <option value={0} disabled>Select Client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <label className="form-label mb-0">Client SPOC</label>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={()=>setShowAddSpoc(true)} disabled={!clientId}>
                <i className="fas fa-plus"/> Add
              </button>
            </div>
            <select className="form-select" value={spocId} onChange={(e)=>setSpocId(Number(e.target.value))} disabled={!spocs.length}>
              <option value={0} disabled>Select Client SPOC</option>
              {spocs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Delivery Date</label>
              <input type="date" className="form-control" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Brief Received On</label>
              <input type="date" className="form-control" value={briefReceivedOn} onChange={(e)=>setBriefReceivedOn(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Estimated Time (hrs)</label>
              <input type="number" className="form-control" value={estimatedTime} onChange={(e)=>setEstimatedTime(e.target.value)} />
            </div>
          </div>

          <div className="d-grid gap-2 mt-3">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (<><span className="spinner-border spinner-border-sm me-2" role="status"></span>Creating...</>) : (<> <i className="fas fa-plus me-2"></i> Create Project </>)}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isLoading}>
              <i className="fas fa-times me-2"></i>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Client (reuses AddClientModal) */}
      <AddClientModal isOpen={showAddClient} onClose={()=>setShowAddClient(false)} onCreated={(client)=>{ setShowAddClient(false); afterClientCreated(); }} />

      {/* Quick Add SPOC */}
      <Modal isOpen={showAddSpoc} onClose={()=>setShowAddSpoc(false)} title="Add Client SPOC">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input className="form-control" value={newSpoc.name} onChange={(e)=>setNewSpoc(v=>({...v, name:e.target.value}))} />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={newSpoc.email} onChange={(e)=>setNewSpoc(v=>({...v, email:e.target.value}))} />
        </div>
        <div className="d-grid gap-2">
          <button className="btn btn-primary" disabled={!clientId || !newSpoc.name.trim() || !newSpoc.email.trim() || isCreatingSpoc} onClick={async()=>{
            setIsCreatingSpoc(true);
            try {
              const created = await SpocService.create({ name: newSpoc.name.trim(), email: newSpoc.email.trim(), clientId });
              const fresh = await SpocService.getByClient(clientId);
              setSpocs(fresh);
              setSpocId(created.id);
              setNewSpoc({ name:'', email:'' });
              setShowAddSpoc(false);
            } catch (e) {
              console.error(e);
            } finally { setIsCreatingSpoc(false); }
          }}>
            {isCreatingSpoc ? (<><span className="spinner-border spinner-border-sm me-2" role="status"></span>Saving...</>) : (<>Save</>)}
          </button>
          <button className="btn btn-outline-secondary" onClick={()=>setShowAddSpoc(false)} disabled={isCreatingSpoc}>Cancel</button>
        </div>
      </Modal>
    </>
  );
};

export default AddProjectModal;

