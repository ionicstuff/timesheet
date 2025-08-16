import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TaskService, { CreateTaskData } from '../services/task.service';
import ProjectService from '../services/project.service';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  department?: string;
  designation?: string;
  role?: string;
}

interface AddTaskModalProps {
  show: boolean;
  onHide: () => void;
  projectId: number;
  onTaskCreated: () => void;
  preselectedAssigneeId?: number;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  show,
  onHide,
  projectId,
  onTaskCreated,
  preselectedAssigneeId
}) => {
  const [formData, setFormData] = useState<CreateTaskData>({
    projectId,
    name: '',
    description: '',
    assignedTo: preselectedAssigneeId,
    estimatedTime: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // keep project/assignee in sync when opening
  useEffect(() => {
    if (!show) return;
    fetchUsers();
    setFormData(prev => ({
      ...prev,
      projectId,
      assignedTo: preselectedAssigneeId
    }));
  }, [show, projectId, preselectedAssigneeId]);

  const fetchUsers = async () => {
    try {
      const fetched = await ProjectService.getUsers();
      setUsers(fetched);
    } catch (e) {
      console.error(e);
      setError('Failed to load team members');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'assignedTo'
          ? (value ? parseInt(value, 10) : undefined)
          : name === 'estimatedTime'
          ? parseFloat(value) || 0
          : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!formData.name.trim()) throw new Error('Task name is required');
      if (formData.estimatedTime <= 0) throw new Error('Estimated time must be greater than 0');

      await TaskService.createTask(formData);

      // reset + notify
      setFormData({
        projectId,
        name: '',
        description: '',
        assignedTo: preselectedAssigneeId,
        estimatedTime: 0
      });
      onTaskCreated();
      onHide();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // lock body scroll and close on ESC
  useEffect(() => {
    if (!show) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onHide();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [show, onHide]);

  if (!show) return null;

  const node = (
    <div
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
      // backdrop
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 2050,               // above Bootstrap modal (1055)
        display: 'grid',
        placeItems: 'center',
        padding: '24px'
      }}
      onClick={onHide}
    >
      {/* dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(720px, 92vw)',
          maxHeight: '90vh',
          background: 'var(--card-bg)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          boxShadow: '0 16px 40px rgba(0,0,0,.35)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--secondary-bg)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h5 style={{ margin: 0, fontWeight: 700 }}>Add New Task</h5>
          <button className="btn-close" aria-label="Close" onClick={onHide} />
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="modal-body"
            style={{
              padding: 16,
              overflowY: 'auto'
            }}
          >
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="mb-3">
              <label htmlFor="taskName" className="form-label">Task Name *</label>
              <input
                id="taskName"
                name="name"
                type="text"
                className="form-control"
                placeholder="Enter task name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{ background: 'var(--secondary-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="taskDescription" className="form-label">Description</label>
              <textarea
                id="taskDescription"
                name="description"
                className="form-control"
                rows={3}
                placeholder="Enter task description"
                value={formData.description}
                onChange={handleInputChange}
                style={{ background: 'var(--secondary-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              />
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="assignedTo" className="form-label">Assign To</label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  className="form-select"
                  value={formData.assignedTo ?? ''}
                  onChange={handleInputChange}
                  style={{ background: 'var(--secondary-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                >
                  <option value="">Select team member (optional)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstname} {u.lastname} {u.role ? `(${u.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="estimatedTime" className="form-label">Estimated Time (hours) *</label>
                <input
                  id="estimatedTime"
                  name="estimatedTime"
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="form-control"
                  placeholder="e.g., 8.5"
                  value={formData.estimatedTime}
                  onChange={handleInputChange}
                  required
                  style={{ background: 'var(--secondary-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                />
              </div>
            </div>

            <div className="mt-3">
              <small className="text-muted">
                * After creating the task, the assigned team member will receive a notification to accept the task.
              </small>
            </div>
          </div>

          <div
            className="modal-footer"
            style={{
              padding: 16,
              borderTop: '1px solid var(--border-color)',
              background: 'var(--card-bg)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Creating…
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(node, document.body);
};

export default AddTaskModal;
