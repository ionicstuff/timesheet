import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProjectService, { Project } from '../services/project.service';
import AddTaskModal from './AddTaskModal';

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
        <div className="card shadow-sm mb-4 modern-card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold gradient-text">{project.name}</h5>
            <span className={project.isActive ? 'badge bg-success' : 'badge bg-danger'}>{project.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0" style={{ color: 'var(--text-primary)' }}>Project Overview</h5>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowAddTaskModal(true)}
                style={{ backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
              >
                <i className="fas fa-plus me-2"></i>
                Add Task
              </button>
            </div>
            <div className="mb-3 project-details">
              <strong>Client:</strong> {project.client.name}<br />
              <strong>Manager:</strong> {project.manager?.firstName && project.manager?.lastName ? `${project.manager.firstName} ${project.manager.lastName}` : 'Not assigned'}<br />
              <strong>Description:</strong> {project.description || 'No description available.'}<br />
              <strong>Start Date:</strong> {project.startDate || 'Not set'}<br />
              <strong>End Date:</strong> {project.endDate || 'Not set'}<br />
            </div>
          </div>
        </div>
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

