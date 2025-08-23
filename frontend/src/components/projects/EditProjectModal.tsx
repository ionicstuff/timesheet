import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { Project } from '../../services/project.service';
import ProjectService from '../../services/project.service';

interface EditProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: (project: Project) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, isOpen, onClose, onProjectUpdated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setStatus((project.status || (project.isActive ? 'active' : 'archived')).toString());
      setError(null);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Backend updateProject requires clientId/managerId/dates/isActive as well.
      const isActive = status !== 'archived' && status !== 'blocked' ? true : project.isActive ?? true;
      const updateBasic: any = {
        name,
        description,
        clientId: project.client?.id ?? null,
        managerId: (project as any).manager?.id ?? null,
        startDate: (project as any).startDate ?? null,
        endDate: (project as any).endDate ?? null,
        isActive
      };
      await ProjectService.updateProject(project.id, updateBasic);

      // Update status via details endpoint (since base update does not handle status)
      await ProjectService.updateProjectDetails(project.id, { status });

      onProjectUpdated({ ...project, name, description, status, isActive } as Project);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update project';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Project`} size="md">
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Project Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Status</label>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="d-grid gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Save Changes
              </>
            )}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
            <i className="fas fa-times me-2"></i>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProjectModal;

