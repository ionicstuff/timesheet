import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProjectService, { Project, CreateProjectData } from '../services/project.service';
import ClientService from '../services/client.service';
import AdminService from '../services/admin.service';
import axios from 'axios';

// Dark theme styles for projects
const projectsStyle = document.createElement('style');
projectsStyle.textContent = `
  .projects-container {
    background-color: var(--primary-bg);
    min-height: 100vh;
    color: var(--text-primary);
  }
  
  .projects-card {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .projects-form-control {
    background-color: var(--secondary-bg) !important;
    border: 1px solid var(--border-color) !important;
    color: var(--text-primary) !important;
    border-radius: 8px;
  }
  
  .projects-form-control:focus {
    background-color: var(--secondary-bg) !important;
    border-color: var(--accent-blue) !important;
    color: var(--text-primary) !important;
    box-shadow: 0 0 0 0.2rem rgba(79, 123, 255, 0.25) !important;
  }
  
  .projects-form-control::placeholder {
    color: var(--text-secondary) !important;
  }
  
  .projects-form-label {
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .projects-nav-tabs {
    border-bottom: 1px solid var(--border-color);
  }
  
  .projects-nav-tabs .nav-link {
    color: var(--text-secondary);
    border: none;
    background: transparent;
  }
  
  .projects-nav-tabs .nav-link.active {
    color: var(--text-primary);
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-bottom-color: var(--card-bg);
  }
  
  .projects-table {
    background-color: var(--card-bg);
  }
  
  .projects-table th {
    background-color: var(--secondary-bg) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
    font-weight: 600;
    font-size: 12px;
    padding: 12px;
  }
  
  .projects-table td {
    background-color: var(--card-bg) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
    padding: 12px;
  }
  
  .projects-table tbody tr:hover {
    background-color: var(--secondary-bg) !important;
  }
  
  .project-name {
    color: var(--text-primary);
    font-weight: 600;
  }
  
  .project-client {
    color: var(--text-secondary);
    font-size: 12px;
  }
  
  .projects-btn-primary {
    background-color: var(--accent-blue);
    border-color: var(--accent-blue);
    color: white;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 600;
  }
  
  .projects-btn-primary:hover {
    background-color: #3d6aff;
    border-color: #3d6aff;
  }
  
  .projects-small-text {
    color: var(--text-secondary);
    font-size: 11px;
  }
`;
document.head.appendChild(projectsStyle);

interface Spoc {
  id: number;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary: boolean;
}

interface ClientWithSpocs {
  id: number;
  clientCode: string;
  clientName: string;
  companyName?: string;
  status: string;
  spocs: Spoc[];
}

const ProjectsContent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'existing'>('existing');
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientWithSpocs[]>([]);
  const [spocs, setSpocs] = useState<Spoc[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newProject, setNewProject] = useState({
    name: '',
    clientId: 0,
    spocId: 0,
    endDate: '',
    briefReceivedOn: '',
    estimatedTime: ''
  });

  useEffect(() => {
    fetchClientsAndManagers();
    if (activeTab === 'existing') {
      fetchProjects();
    }
  }, [activeTab]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const fetchedProjects = await ProjectService.getProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      setError('Error fetching projects');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientsAndManagers = async () => {
    // Fetch clients with SPOCs
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/client-management/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setClients(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError(`Error fetching clients: ${err.message || 'Unknown error'}`);
    }

    // Fetch users/managers separately
    try {
      const fetchedUsers = await AdminService.getUsers();
      setManagers(fetchedUsers.users.filter((u: any) => u.role === 'manager' || u.role === 'admin'));
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const handleClientChange = (clientId: number) => {
    setNewProject({ ...newProject, clientId, spocId: 0 });
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSpocs(client.spocs || []);
    } else {
      setSpocs([]);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const projectData = {
        name: newProject.name,
        clientId: newProject.clientId,
        spocId: newProject.spocId,
        endDate: newProject.endDate || undefined,
        briefReceivedOn: newProject.briefReceivedOn || undefined,
        estimatedTime: newProject.estimatedTime ? parseFloat(newProject.estimatedTime) : undefined
      };
      await ProjectService.createProject(projectData as any);
      setNewProject({
        name: '',
        clientId: 0,
        spocId: 0,
        endDate: '',
        briefReceivedOn: '',
        estimatedTime: ''
      });
      setSpocs([]);
      setActiveTab('existing');
    } catch (err) {
      setError('Error creating project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProjectDetails = (projectId: number) => {
    navigate(`/project-view/${projectId}`);
  };

  const handleEditProjectDetails = (projectId: number) => {
    navigate(`/project-details/${projectId}`);
  };

  return (
    <div className="container-fluid px-4 py-4 projects-container">
      <h2 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Project Management</h2>

      <ul className="nav nav-tabs mb-4 projects-nav-tabs">
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'existing' ? 'active' : ''}`} href="#" onClick={() => setActiveTab('existing')}>Existing Projects</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'create' ? 'active' : ''}`} href="#" onClick={() => setActiveTab('create')}>Create New Project</a>
        </li>
      </ul>

      {error && <div className="alert alert-danger">{error}</div>}

      {activeTab === 'create' && (
        <div className="card border-0 shadow-sm projects-card">
          <div className="card-body">
            <h5 className="card-title fw-bold" style={{ color: 'var(--text-primary)' }}>
              <i className="fas fa-plus-circle me-2" style={{ color: 'var(--accent-blue)' }}></i>
              Create New Project
            </h5>
            <form onSubmit={handleCreateProject}>
              <div className="mb-3">
                <label className="form-label projects-form-label">Project Name</label>
                <input type="text" className="form-control projects-form-control" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label projects-form-label">Client</label>
                <select className="form-select projects-form-control" value={newProject.clientId} onChange={(e) => handleClientChange(+e.target.value)} required>
                  <option value={0} disabled>Select Client</option>
                  {clients && clients.map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
                </select>
                <small className="projects-small-text">Clients loaded: {clients ? clients.length : 0}</small>
              </div>
              
              <div className="mb-3">
                <label className="form-label projects-form-label">Client SPOC</label>
                <select className="form-select projects-form-control" value={newProject.spocId} onChange={(e) => setNewProject({ ...newProject, spocId: +e.target.value })} required disabled={!spocs || !spocs.length}>
                  <option value={0} disabled>Select Client SPOC</option>
                  {spocs && spocs.map(spoc => <option key={spoc.id} value={spoc.id}>{spoc.name} ({spoc.email})</option>)}
                </select>
                {(!spocs || !spocs.length) && <small className="projects-small-text">Select a client first to see SPOCs</small>}
              </div>
              
              <div className="mb-3">
                <label className="form-label projects-form-label">Overall Project Delivery Date & Time</label>
                <input 
                  type="date" 
                  className="form-control projects-form-control" 
                  value={newProject.endDate} 
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label projects-form-label">Brief Received On</label>
                <input 
                  type="date" 
                  className="form-control projects-form-control" 
                  value={newProject.briefReceivedOn} 
                  onChange={(e) => setNewProject({ ...newProject, briefReceivedOn: e.target.value })}
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label projects-form-label">Project Estimated Time (hours)</label>
                <input 
                  type="number" 
                  className="form-control projects-form-control" 
                  placeholder="Enter estimated time in hours"
                  value={newProject.estimatedTime} 
                  onChange={(e) => setNewProject({ ...newProject, estimatedTime: e.target.value })}
                />
              </div>
              
              <button 
                type="submit" 
                className="btn projects-btn-primary" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus me-2"></i>
                    Create Project
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'existing' && (
        <div className="card border-0 shadow-sm modern-card">
          <div className="card-body">
            <h5 className="card-title fw-bold mb-4" style={{ color: '#273C63' }}>
              <i className="fas fa-list me-2" style={{ color: '#7EC8EC' }}></i>
              All Projects
            </h5>
            {isLoading ? (
              <p>Loading projects...</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ backgroundColor: '#333', color: '#fff' }}>
                <thead style={{ backgroundColor: '#444', color: '#fff' }}>
                    <tr>
      	<th style={{ color: '#ffffff', fontWeight: '600' }}>Name</th>
                      <th style={{ color: '#273C63', fontWeight: '600' }}>Client</th>
                      <th style={{ color: '#273C63', fontWeight: '600' }}>Status</th>
                      <th style={{ color: '#273C63', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ backgroundColor: '#333', color: '#fff' }}>
                    {projects.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #555', backgroundColor: '#333' }}>
                        <td>
                          <div className="fw-semibold dark-text">{p.name}</div>
                        </td>
                        <td>
                          <span className="text-muted dark-text">{p.client.name}</span>
                        </td>
                        <td>
                          <span className={`badge ${p.isActive ? 'bg-success' : 'bg-secondary'} rounded-pill`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary me-2" 
                            onClick={() => handleViewProjectDetails(p.id)}
                            style={{ 
                              backgroundColor: '#007bff',
                              borderColor: '#007bff',
                              borderRadius: '6px'
                            }}
                          >
                            <i className="fas fa-eye me-1 dark-text"></i>
                            View
                          </button>
                          <button 
                            className="btn btn-sm me-2"
                            onClick={() => handleEditProjectDetails(p.id)}
                            style={{ 
                              backgroundColor: '#17a2b8',
                              borderColor: '#17a2b8',
                              color: 'white',
                              borderRadius: '6px'
                            }}
                          >
                            <i className="fas fa-edit me-1 dark-text"></i>
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            style={{ borderRadius: '6px' }}
                          >
                            <i className="fas fa-trash me-1 dark-text"></i>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsContent;
