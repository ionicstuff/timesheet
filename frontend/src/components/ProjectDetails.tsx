import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProjectService, { Project, ProjectDetails as ProjectDetailsType, ProjectAttachment } from '../services/project.service';
import Toast from './Toast';

// Enhanced CSS for modern UI
const customStyle = document.createElement('style');
customStyle.textContent = `
  .white-placeholder::placeholder {
    color: rgba(255, 255, 255, 0.7) !important;
    opacity: 1;
  }
  .white-placeholder::-webkit-input-placeholder {
    color: rgba(255, 255, 255, 0.7) !important;
  }
  .white-placeholder::-moz-placeholder {
    color: rgba(255, 255, 255, 0.7) !important;
  }
  .white-placeholder:-ms-input-placeholder {
    color: rgba(255, 255, 255, 0.7) !important;
  }
  
  .modern-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .modern-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .pulse-animation {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(126, 200, 236, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(126, 200, 236, 0); }
    100% { box-shadow: 0 0 0 0 rgba(126, 200, 236, 0); }
  }
  
  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .stat-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }
  
  .stat-card:hover {
    transform: scale(1.02);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  }
`;
document.head.appendChild(customStyle);

const ProjectDetails: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{
      message: string;
      type: 'success' | 'error' | 'warning' | 'info';
      isVisible: boolean;
    }>({ message: '', type: 'info', isVisible: false });

    // Form state for project details
    const [formData, setFormData] = useState<ProjectDetailsType>({
      teamNotes: '',
      objectives: '',
      deliverables: '',
      priority: 'medium',
      status: 'planning',
      clientLinks: ''
    });

    // File upload state
    const [files, setFiles] = useState<{
      brief: File | null;
      brandGuideline: File | null;
      references: File[];
    }>({
      brief: null,
      brandGuideline: null,
      references: []
    });

    const [users, setUsers] = useState<Array<{ id: number; firstname: string; lastname: string; email: string; department?: string; designation?: string; role?: string }>>([]);

    useEffect(() => {
        fetchProject();
        fetchUsers();
    }, [projectId]);

    const fetchUsers = async () => {
        try {
            const fetchedUsers = await ProjectService.getUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchProject = async () => {
        try {
            const fetchedProject = await ProjectService.getProject(Number(projectId));
            setProject(fetchedProject);
            
            // Prefill form data with existing project details
            setFormData({
                teamNotes: fetchedProject.teamNotes || '',
                objectives: fetchedProject.objectives || '',
                deliverables: fetchedProject.deliverables || '',
                priority: fetchedProject.priority || 'medium',
                status: fetchedProject.status || 'planning',
                clientLinks: fetchedProject.clientLinks || ''
            });
        } catch (error) {
            setError('Error fetching project details');
        } finally {
            setLoading(false);
        }
    };

    const handleToastClose = () => {
      setToast(prev => ({ ...prev, isVisible: false }));
    };

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      setToast({ message, type, isVisible: true });
    };

    const handleSaveTeamAlignment = async () => {
      if (!project) return;
      
      setSaving(true);
      try {
        await ProjectService.updateProjectDetails(project.id, {
          teamNotes: formData.teamNotes
        });
        showToast('Team alignment saved successfully!', 'success');
      } catch (error) {
        showToast('Error saving team alignment', 'error');
      } finally {
        setSaving(false);
      }
    };

    const handleSaveSpecifications = async () => {
      if (!project) return;
      
      setSaving(true);
      try {
        await ProjectService.updateProjectDetails(project.id, {
          objectives: formData.objectives,
          deliverables: formData.deliverables,
          priority: formData.priority,
          status: formData.status
        });
        showToast('Specifications saved successfully!', 'success');
      } catch (error) {
        showToast('Error saving specifications', 'error');
      } finally {
        setSaving(false);
      }
    };

    const handleFileUpload = async () => {
      if (!project) return;
      
      const formData = new FormData();
      if (files.brief) formData.append('brief', files.brief);
      if (files.brandGuideline) formData.append('brandGuideline', files.brandGuideline);
      files.references.forEach((file, index) => {
        formData.append(`reference_${index}`, file);
      });
      
      setSaving(true);
      try {
        await ProjectService.uploadProjectFiles(project.id, formData);
        showToast('Files uploaded successfully!', 'success');
        // Reset file state
        setFiles({ brief: null, brandGuideline: null, references: [] });
      } catch (error) {
        showToast('Error uploading files', 'error');
      } finally {
        setSaving(false);
      }
    };

    const handleSaveClientLinks = async () => {
      if (!project) return;
      
      setSaving(true);
      try {
        await ProjectService.updateProjectDetails(project.id, {
          clientLinks: formData.clientLinks
        });
        showToast('Client links saved successfully!', 'success');
      } catch (error) {
        showToast('Error saving client links', 'error');
      } finally {
        setSaving(false);
      }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
      <div className="d-flex" style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative'
      }}>

        {/* Sidebar */}
        <div className="text-white shadow-lg" style={{ 
          width: '240px', 
          minHeight: '100vh', 
          background: `linear-gradient(135deg, #273C63 0%, #666983 100%)` 
        }}>
          <div className="p-2">
            {/* Logo and Company */}
            <div className="d-flex align-items-center mb-4 pb-3 border-bottom border-light border-opacity-25">
              <div className="me-3" style={{ 
                width: '45px', 
                height: '45px', 
                backgroundColor: '#7EC8EC', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <i className="fas fa-clock text-white" style={{ fontSize: '20px' }}></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0">TimeSheet Pro</h5>
                <small className="text-light opacity-75">Evolute Global</small>
              </div>
            </div>
            
            {/* Navigation */}
            <ul className="nav nav-pills flex-column">
              <li className="nav-item mb-1">
                <a className="nav-link text-white d-flex align-items-center py-3 px-3 rounded" 
                   onClick={() => navigate('/dashboard')}
                   style={{ 
                     cursor: 'pointer',
                     transition: 'all 0.3s ease'
                   }}>
                  <i className="fas fa-home me-3" style={{ width: '20px' }}></i>
                  <span>Dashboard</span>
                </a>
              </li>
              <li className="nav-item mb-1">
                <a className="nav-link text-white d-flex align-items-center py-3 px-3 rounded"
                   onClick={() => navigate('/projects')}
                   style={{ 
                     cursor: 'pointer',
                     transition: 'all 0.3s ease' 
                   }}>
                  <i className="fas fa-project-diagram me-3" style={{ width: '20px' }}></i>
                  <span>Projects</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1">
          {/* Header */}
          <nav className="navbar navbar-expand-lg shadow-sm" style={{ 
            backgroundColor: '#FFFFFF', 
            borderBottom: '1px solid #EAF1ED' 
          }}>
            <div className="container-fluid px-4">
              <div className="d-flex align-items-center">
                <h4 className="mb-0 fw-bold" style={{ color: '#273C63' }}>
                  Project Details
                </h4>
              </div>
              <div className="navbar-nav ms-auto d-flex align-items-center">
                {/* User Info */}
                <div className="nav-item dropdown position-relative">
                  <button 
                    className="nav-link dropdown-toggle d-flex align-items-center border-0 bg-transparent" 
                    onClick={() => logout()}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="me-2 text-end">
                      <div className="fw-bold" style={{ color: '#273C63', fontSize: '14px' }}>
                        {user ? `${user.firstName} ${user.lastName}` : 'User'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '12px' }}>
                        {user?.role || 'Employee'}
                      </div>
                    </div>
                    <span className="badge rounded-circle d-flex align-items-center justify-content-center" style={{ 
                      width: '40px', 
                      height: '40px', 
                      backgroundColor: '#7EC8EC',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : 'U'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </nav>
          
          <div className="container-fluid px-4 py-4">
            {project ? (
              <div className="card shadow-sm mb-4 modern-card">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold gradient-text">{project.name}</h5>
                  <span className={project.isActive ? 'badge bg-success' : 'badge bg-danger'}>{project.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="card-body">
                  <h5 className="card-title">Project Overview</h5>
                  <div className="mb-3">
                    <strong>Client:</strong> {project.client.name}<br/>
                    <strong>Manager:</strong> {project.manager?.firstName && project.manager?.lastName ? `${project.manager.firstName} ${project.manager.lastName}` : 'Not assigned'}<br/>
                    <strong>Description:</strong> {project.description || 'No description available.'}<br/>
                    <strong>Start Date:</strong> {project.startDate || 'Not set'}<br/>
                    <strong>End Date:</strong> {project.endDate || 'Not set'}<br/>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-danger">Project not found</div>
            )}
            
            {project && (
              <>
                {/* Team Alignment Section */}
              <div className="card shadow-sm mb-4 modern-card">
                <div className="card-header bg-white">
                  <h5 className="mb-0 fw-bold" style={{ color: '#273C63' }}>
                    <i className="fas fa-users me-2" style={{ color: '#7EC8EC' }}></i>
                    Team Alignment
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Assign Team Members</label>
                    <select className="form-select" multiple size={6}>
                      <option value="" disabled>Select team members...</option>
                      {users.map(user => (
                          <option key={user.id} value={String(user.id)}>
                          {user.firstname} {user.lastname} - {user.designation || user.role} ({user.department})
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Select team members for this project (hold Ctrl/Cmd to select multiple)</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Team Notes</label>
                  <textarea className="form-control" rows={3} placeholder="Add notes about team allocation, roles, or responsibilities..." value={formData.teamNotes} onChange={(e) => setFormData({ ...formData, teamNotes: e.target.value })}></textarea>
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveTeamAlignment} disabled={saving}>
                    {saving ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-save me-2"></i>}
                    Save Team Alignment
                  </button>
                </div>
              </div>
              
              {/* Specifications Section */}
              <div className="card shadow-sm mb-4 modern-card">
                <div className="card-header bg-white">
                  <h5 className="mb-0 fw-bold" style={{ color: '#273C63' }}>
                    <i className="fas fa-clipboard-list me-2" style={{ color: '#7EC8EC' }}></i>
                    Specifications
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Objectives</label>
                  <textarea 
                      className="form-control" 
                      rows={4} 
                      placeholder="Define project objectives, goals, and expected outcomes..."
                      value={formData.objectives}
                      onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Deliverables</label>
                  <textarea 
                      className="form-control" 
                      rows={4} 
                      placeholder="List specific deliverables and milestones..."
                      value={formData.deliverables}
                      onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Priority</label>
                      <select className="form-select" value={formData.priority || ''} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}>
                        <option value="">Select priority...</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Status</label>
                      <select className="form-select" value={formData.status || ''} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                        <option value="">Select status...</option>
                        <option value="planning">Planning</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Under Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button className="btn btn-primary me-2" onClick={handleSaveSpecifications} disabled={saving}>
                      {saving ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-save me-2"></i>}
                      Save Specifications
                    </button>
                    <button className="btn btn-outline-secondary">
                      <i className="fas fa-times me-2"></i>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Attachments & Links Section */}
              <div className="card shadow-sm mb-4 modern-card">
                <div className="card-header bg-white">
                  <h5 className="mb-0 fw-bold" style={{ color: '#273C63' }}>
                    <i className="fas fa-paperclip me-2" style={{ color: '#7EC8EC' }}></i>
                    Attachments & Links
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Brief Document</label>
                    <input type="file" className="form-control" accept=".pdf,.doc,.docx" onChange={(e) => setFiles({ ...files, brief: e.target.files?.[0] || null })} />
                    <small className="text-muted">Upload project brief document</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Brand Guideline Document</label>
                    <input type="file" className="form-control" accept=".pdf,.doc,.docx" onChange={(e) => setFiles({ ...files, brandGuideline: e.target.files?.[0] || null })} />
                    <small className="text-muted">Upload brand guidelines if available</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Other Reference Files</label>
                    <input type="file" className="form-control" accept=".pdf,.doc,.docx,.zip" multiple onChange={(e) => setFiles({ ...files, references: Array.from(e.target.files || []) })} />
                    <small className="text-muted">Upload additional reference files (multiple allowed)</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Client Shared Links (one URL per line)</label>
                    <textarea 
                      className="form-control" 
                      rows={3} 
                      placeholder="https://example.com\nhttps://drive.google.com/...\nhttps://figma.com/..."
                      value={formData.clientLinks}
                      onChange={(e) => setFormData({ ...formData, clientLinks: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="mt-3">
                    <button className="btn btn-primary me-2" onClick={handleFileUpload} disabled={saving}>
                      {saving ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-upload me-2"></i>}
                      Upload Files
                    </button>
                    <button className="btn btn-outline-secondary">
                      <i className="fas fa-eye me-2"></i>
                      View Existing Files
                    </button>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={handleToastClose}
      />
      </div>
    );
};

export default ProjectDetails;

