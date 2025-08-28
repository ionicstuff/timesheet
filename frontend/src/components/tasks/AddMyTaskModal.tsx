import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import ProjectService, { Project } from '../../services/project.service';
import TaskService from '../../services/task.service';
import { useAuth } from '../../context/AuthContext';

interface AddMyTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const AddMyTaskModal: React.FC<AddMyTaskModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([] as any);
  const [projectId, setProjectId] = useState<number>(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const data = await ProjectService.getProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load projects for AddMyTaskModal', e);
      }
    })();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) { setError('Please select a project'); return; }
    if (!name.trim()) { setError('Task name is required'); return; }
    const est = Number(estimatedTime);
    if (!est || est <= 0) { setError('Estimated time must be greater than 0'); return; }

    setError(null);
    setLoading(true);
    try {
      await TaskService.createTask({
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        assignedTo: user?.id, // assign to self
        estimatedTime: est,
      } as any);
      // reset
      setProjectId(0); setName(''); setDescription(''); setEstimatedTime('');
      onCreated();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create task';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const projectLabel = (p: any) => p.projectCode ? `${p.projectCode} — ${p.name || p.projectName || 'Project'}` : (p.name || p.projectName || 'Project');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task" size="md">
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Project</label>
          <select className="form-select" value={projectId} onChange={(e)=>setProjectId(Number(e.target.value))}
            style={{ background: 'var(--secondary-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} required>
            <option value={0} disabled>Select Project</option>
            {projects.map((p:any)=> <option key={p.id} value={p.id}>{projectLabel(p)}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Task Name</label>
          <input className="form-control" value={name} onChange={(e)=>setName(e.target.value)} required
            placeholder="Enter task name"
            style={{ background: 'var(--secondary-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
        </div>
        <div className="mb-3">
          <label className="form-label">Description (optional)</label>
          <textarea className="form-control" rows={3} value={description} onChange={(e)=>setDescription(e.target.value)}
            placeholder="Describe the task"
            style={{ background: 'var(--secondary-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
        </div>
        <div className="mb-3">
          <label className="form-label">Estimated Time (hours)</label>
          <input type="number" min="0.5" step="0.5" className="form-control" value={estimatedTime} onChange={(e)=>setEstimatedTime(e.target.value)} required
            placeholder="e.g., 2" 
            style={{ background: 'var(--secondary-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
        </div>
        <div className="d-grid gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? (<><span className="spinner-border spinner-border-sm me-2" role="status"/>Creating…</>) : 'Create Task'}</button>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMyTaskModal;

