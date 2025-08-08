import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProjectService, { Project } from '../services/project.service';
import AddTaskModal from './AddTaskModal';
import axios from 'axios';

// Dark theme styles for Project View
const customStyle = document.createElement('style');
customStyle.textContent = `
  .modern-card {
    background-color: var(--card-bg) !important;
    border: 1px solid var(--border-color) !important;
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.3) !important;
    transition: all 0.3s ease;
  }

  .modern-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 16px rgba(0, 0, 0, 0.4) !important;
  }

  .modern-card .card-header {
    background-color: var(--secondary-bg) !important;
    border-bottom: 1px solid var(--border-color) !important;
    color: var(--text-primary) !important;
  }
  
  .modern-card .card-body {
    background-color: var(--card-bg) !important;
    color: var(--text-primary) !important;
  }

  .gradient-text {
    color: var(--text-primary) !important;
    font-weight: 600;
  }
  
  .project-details strong {
    color: var(--text-primary) !important;
  }
  
  .list-group-item {
    background-color: transparent !important;
    border: none !important;
    border-bottom: 1px solid var(--border-color) !important;
    color: var(--text-primary) !important;
  }
  
  .badge {
    font-size: 0.75rem;
    padding: 0.25em 0.5em;
  }
  
  .text-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .card-header h5, .card-header h6 {
    color: var(--text-primary) !important;
  }
  
  .text-muted {
    color: var(--text-secondary) !important;
  }
`;
document.head.appendChild(customStyle);

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string | undefined): string => {
    if (!status) return 'bg-secondary';
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'completed') return 'bg-success';
    if (statusLower === 'active' || statusLower === 'in-progress') return 'bg-primary';
    if (statusLower === 'on_hold' || statusLower === 'on-hold') return 'bg-warning';
    if (statusLower === 'cancelled') return 'bg-danger';
    
    return 'bg-secondary';
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const fetchedProject = await ProjectService.getProject(Number(projectId));
        setProject(fetchedProject);
      } catch (error) {
        setError('Error fetching project details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);

  // Handle task creation
  const handleTaskCreated = () => {
    console.log('Task created successfully');
    // TODO: Add notification system or refresh task list
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
      backgroundColor: 'var(--primary-bg)',
      position: 'relative'
    }}>

      {/* Sidebar */}
      <div className="text-white shadow-lg" style={{ 
        width: '240px', 
        minHeight: '100vh', 
        backgroundColor: 'var(--sidebar-bg)' 
      }}>
        <div className="p-2">
          {/* Logo and Company */}
          <div className="d-flex align-items-center mb-4 pb-3 border-bottom border-light border-opacity-25">
            <div className="me-3" style={{ 
              width: '45px', 
              height: '45px', 
              backgroundColor: 'var(--accent-blue)', 
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
          backgroundColor: 'var(--card-bg)', 
          borderBottom: '1px solid var(--border-color)',
          color: 'var(--text-primary)'
        }}>
          <div className="container-fluid px-4">
            <div className="d-flex align-items-center">
              <h4 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                Project Details (View)
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
                    <div className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                      {user ? `${user.firstName} ${user.lastName}` : 'User'}
                    </div>
                    <div className="text-muted" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {user?.role || 'Employee'}
                    </div>
                  </div>
                  <span className="badge rounded-circle d-flex align-items-center justify-content-center" style={{ 
                    width: '40px', 
                    height: '40px', 
                    backgroundColor: 'var(--accent-blue)',
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
        
        <div className="container-fluid px-4 py-4" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--text-primary)' }}>
          {project ? (
            <>
              {/* Project Header Card */}
              <div className="card shadow-sm mb-4 modern-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h3 className="mb-0 fw-bold gradient-text">{project.name}</h3>
                  <div className="d-flex align-items-center gap-2">
                    <span className={project.isActive ? 'badge bg-success' : 'badge bg-danger'}>
                      {project.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => setShowAddTaskModal(true)}
                      style={{ backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add Task
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <h5 className="mb-3" style={{ color: 'var(--text-primary)' }}>Project Overview</h5>
                      <div className="row">
                        <div className="col-sm-6">
                          <p className="mb-2"><strong>Client:</strong> {project.client.name}</p>
                          <p className="mb-2"><strong>Manager:</strong> {project.manager?.firstName && project.manager?.lastName ? `${project.manager.firstName} ${project.manager.lastName}` : 'Not assigned'}</p>
                          <p className="mb-2"><strong>Status:</strong> <span className={`badge ${getStatusBadgeClass(project.status)}`}>{project.status || 'Planning'}</span></p>
                        </div>
                        <div className="col-sm-6">
                          <p className="mb-2"><strong>Start Date:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}</p>
                          <p className="mb-2"><strong>End Date:</strong> {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}</p>
                          <p className="mb-2"><strong>Priority:</strong> <span className={`badge ${project.priority === 'high' ? 'bg-danger' : project.priority === 'medium' ? 'bg-warning' : 'bg-info'}`}>{project.priority || 'Medium'}</span></p>
                        </div>
                      </div>
                      {project.description && (
                        <div className="mt-3">
                          <p className="mb-1"><strong>Description:</strong></p>
                          <p className="text-muted">{project.description}</p>
                        </div>
                      )}
                    </div>
                    <div className="col-md-4">
                      <div className="bg-light p-3 rounded" style={{ backgroundColor: 'var(--secondary-bg) !important' }}>
                        <h6 className="mb-3" style={{ color: 'var(--text-primary)' }}>Quick Stats</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Team Members:</span>
                          <span className="fw-bold">{project.teamMembers?.length || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Tasks:</span>
                          <span className="fw-bold">{project.tasks?.length || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Documents:</span>
                          <span className="fw-bold">{project.documents?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SPOC Information Card */}
              {project.spoc && (
                <div className="card shadow-sm mb-4 modern-card">
                  <div className="card-header">
                    <h5 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                      <i className="fas fa-user-tie me-2" style={{ color: 'var(--accent-blue)' }}></i>
                      Client SPOC Information
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-2"><strong>Name:</strong> {project.spoc.name}</p>
                        <p className="mb-2"><strong>Email:</strong> 
                          <a href={`mailto:${project.spoc.email}`} className="ms-2 text-decoration-none">
                            {project.spoc.email}
                          </a>
                        </p>
                      </div>
                      <div className="col-md-6">
                        {project.spoc.phone && <p className="mb-2"><strong>Phone:</strong> {project.spoc.phone}</p>}
                        {project.spoc.designation && <p className="mb-2"><strong>Designation:</strong> {project.spoc.designation}</p>}
                        {project.spoc.department && <p className="mb-2"><strong>Department:</strong> {project.spoc.department}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                {/* Team Members Card */}
                <div className="col-md-6 mb-4">
                  <div className="card shadow-sm modern-card h-100">
                    <div className="card-header">
                      <h5 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                        <i className="fas fa-users me-2" style={{ color: 'var(--accent-blue)' }}></i>
                        Team Members
                      </h5>
                    </div>
                    <div className="card-body">
                      {project.teamMembers && project.teamMembers.length > 0 ? (
                        <div className="list-group list-group-flush">
                          {project.teamMembers.map((member, index) => (
                            <div key={index} className="list-group-item" style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                              <div className="d-flex align-items-center">
                                <div className="me-3">
                                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: 'var(--accent-blue) !important' }}>
                                    <span className="text-white fw-bold">
                                      {member.assignedTo?.firstName?.[0]}{member.assignedTo?.lastName?.[0]}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-1">{member.assignedTo?.firstName} {member.assignedTo?.lastName}</h6>
                                  {member.assignedTo?.department && (
                                    <small className="text-muted">{member.assignedTo.department}</small>
                                  )}
                                  {member.taskName && (
                                    <div className="mt-1">
                                      <small className="badge bg-light text-dark">{member.taskName}</small>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fas fa-users fa-2x text-muted mb-3"></i>
                          <p className="text-muted">No team members assigned yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tasks Overview Card */}
                <div className="col-md-6 mb-4">
                  <div className="card shadow-sm modern-card h-100">
                    <div className="card-header">
                      <h5 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                        <i className="fas fa-tasks me-2" style={{ color: 'var(--accent-blue)' }}></i>
                        Tasks Overview
                      </h5>
                    </div>
                    <div className="card-body">
                      {project.tasks && project.tasks.length > 0 ? (
                        <div className="list-group list-group-flush">
                          {project.tasks.slice(0, 5).map((task, index) => (
                            <div key={index} className="list-group-item" style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="fw-medium">{task}</span>
                                <span className="badge bg-secondary">Assigned</span>
                              </div>
                            </div>
                          ))}
                          {project.tasks.length > 5 && (
                            <div className="text-center mt-2">
                              <small className="text-muted">And {project.tasks.length - 5} more tasks...</small>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fas fa-tasks fa-2x text-muted mb-3"></i>
                          <p className="text-muted">No tasks created yet</p>
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => setShowAddTaskModal(true)}
                          >
                            Create First Task
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Details & Documents Row */}
              <div className="row">
                {/* Project Specifications Card */}
                <div className="col-md-8 mb-4">
                  <div className="card shadow-sm modern-card">
                    <div className="card-header">
                      <h5 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                        <i className="fas fa-clipboard-list me-2" style={{ color: 'var(--accent-blue)' }}></i>
                        Project Specifications
                      </h5>
                    </div>
                    <div className="card-body">
                      {project.objectives || project.deliverables || project.teamNotes ? (
                        <>
                          {project.objectives && (
                            <div className="mb-4">
                              <h6 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Objectives</h6>
                              <p className="text-muted">{project.objectives}</p>
                            </div>
                          )}
                          {project.deliverables && (
                            <div className="mb-4">
                              <h6 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Deliverables</h6>
                              <p className="text-muted">{project.deliverables}</p>
                            </div>
                          )}
                          {project.teamNotes && (
                            <div className="mb-4">
                              <h6 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Team Notes</h6>
                              <p className="text-muted">{project.teamNotes}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fas fa-clipboard-list fa-2x text-muted mb-3"></i>
                          <p className="text-muted">Project specifications not defined yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents & Links Card */}
                <div className="col-md-4 mb-4">
                  <div className="card shadow-sm modern-card">
                    <div className="card-header">
                      <h5 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                        <i className="fas fa-paperclip me-2" style={{ color: 'var(--accent-blue)' }}></i>
                        Documents & Links
                      </h5>
                    </div>
                    <div className="card-body">
                      {/* Documents Section */}
                      {project.documents && project.documents.length > 0 ? (
                        <div className="mb-3">
                          <h6 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Files</h6>
                          {project.documents.map((doc, index) => (
                            <div key={index} className="d-flex align-items-center mb-2">
                              <i className="fas fa-file me-2 text-muted"></i>
                              <span className="small text-truncate" title={doc.originalName}>
                                {doc.originalName}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <i className="fas fa-folder-open fa-2x text-muted mb-2"></i>
                          <p className="text-muted small">No documents uploaded</p>
                        </div>
                      )}
                      
                      {/* Client Links Section */}
                      {project.clientLinks && (
                        <div className="mt-3">
                          <h6 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Client Links</h6>
                          {project.clientLinks.split('\n').filter(link => link.trim()).map((link, index) => (
                            <div key={index} className="mb-2">
                              <a 
                                href={link.trim()} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-decoration-none small d-flex align-items-center"
                              >
                                <i className="fas fa-external-link-alt me-2"></i>
                                <span className="text-truncate" title={link.trim()}>
                                  {link.trim().replace(/https?:\/\//, '').split('/')[0]}
                                </span>
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-danger">Project not found</div>
          )}
        </div>

        {/* Add Task Modal */}
        <AddTaskModal
          show={showAddTaskModal}
          onHide={() => setShowAddTaskModal(false)}
          projectId={Number(projectId)}
          onTaskCreated={handleTaskCreated}
        />
      </div>
    </div>
  );
};

export default ProjectView;

