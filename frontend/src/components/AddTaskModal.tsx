import React, { useState, useEffect } from 'react';
import TaskService, { CreateTaskData } from '../services/task.service';
import ProjectService from '../services/project.service';

interface User {
  id: number;
  firstname: string;  // API returns lowercase
  lastname: string;   // API returns lowercase
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
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ show, onHide, projectId, onTaskCreated }) => {
  const [formData, setFormData] = useState<CreateTaskData>({
    projectId,
    name: '',
    description: '',
    assignedTo: undefined,
    estimatedTime: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      fetchUsers();
      setFormData(prev => ({ ...prev, projectId }));
    }
  }, [show, projectId]);

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await ProjectService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load team members');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'assignedTo' ? (value ? parseInt(value) : undefined) : 
               name === 'estimatedTime' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name.trim()) {
        throw new Error('Task name is required');
      }
      if (formData.estimatedTime <= 0) {
        throw new Error('Estimated time must be greater than 0');
      }

      await TaskService.createTask(formData);
      
      // Reset form
      setFormData({
        projectId,
        name: '',
        description: '',
        assignedTo: undefined,
        estimatedTime: 0
      });
      
      onTaskCreated();
      onHide();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Task</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <div className="mb-3">
                <label htmlFor="taskName" className="form-label">Task Name *</label>
                <input
                  type="text"
                  className="form-control"
                  id="taskName"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter task name"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="taskDescription" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="taskDescription"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter task description"
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <label htmlFor="assignedTo" className="form-label">Assign To</label>
                  <select
                    className="form-select"
                    id="assignedTo"
                    name="assignedTo"
                    value={formData.assignedTo || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">Select team member (optional)</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstname || 'N/A'} {user.lastname || 'N/A'} ({user.role || 'No Role'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label htmlFor="estimatedTime" className="form-label">Estimated Time (hours) *</label>
                  <input
                    type="number"
                    className="form-control"
                    id="estimatedTime"
                    name="estimatedTime"
                    value={formData.estimatedTime}
                    onChange={handleInputChange}
                    min="0.5"
                    step="0.5"
                    required
                    placeholder="e.g., 8.5"
                  />
                </div>
              </div>

              <div className="mt-3">
                <small className="text-muted">
                  * After creating the task, the assigned team member will receive a notification to accept the task.
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
