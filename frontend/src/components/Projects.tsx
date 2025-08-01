import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProjectService, { Project, CreateProjectData } from '../services/project.service';
import ProjectsLayout from './ProjectsLayout';
import ClientService from '../services/client.service'; // Assuming a client service exists
import AdminService from '../services/admin.service'; // Assuming an admin service for users
import axios from 'axios';

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
`;
document.head.appendChild(customStyle);

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

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
      console.log('API Response:', response.data);
      console.log('Clients data:', response.data.data);
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
      // Don't set error for managers as it's not critical for client dropdown
    }
  };

  const handleClientChange = (clientId: number) => {
    console.log('Selected client ID:', clientId);
    console.log('Available clients:', clients);
    setNewProject({ ...newProject, clientId, spocId: 0 });
    const client = clients.find(c => c.id === clientId);
    console.log('Found client:', client);
    if (client) {
      console.log('Client SPOCs:', client.spocs);
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
    <ProjectsLayout>
      <h2 className="fw-bold mb-4">Project Management</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'existing' ? 'active' : ''}`} href="#" onClick={() => setActiveTab('existing')}>Existing Projects</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'create' ? 'active' : ''}`} href="#" onClick={() => setActiveTab('create')}>Create New Project</a>
        </li>
      </ul>

      {error && <div className="alert alert-danger">{error}</div>}

      {activeTab === 'create' && (
        <div className="card border-0 shadow-sm modern-card">
          <div className="card-body">
            <h5 className="card-title fw-bold" style={{ color: '#273C63' }}>
              <i className="fas fa-plus-circle me-2" style={{ color: '#7EC8EC' }}></i>
              Create New Project
            </h5>
            <form onSubmit={handleCreateProject}>
              <div className="mb-3">
                <label className="form-label">Project Name</label>
                <input type="text" className="form-control" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Client</label>
                <select className="form-select" value={newProject.clientId} onChange={(e) => handleClientChange(+e.target.value)} required>
                  <option value={0} disabled>Select Client</option>
                  {clients && clients.map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
                </select>
                <small className="text-muted">Clients loaded: {clients ? clients.length : 0}</small>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Client SPOC</label>
                <select className="form-select" value={newProject.spocId} onChange={(e) => setNewProject({ ...newProject, spocId: +e.target.value })} required disabled={!spocs || !spocs.length}>
                  <option value={0} disabled>Select Client SPOC</option>
                  {spocs && spocs.map(spoc => <option key={spoc.id} value={spoc.id}>{spoc.name} ({spoc.email})</option>)}
                </select>
                {(!spocs || !spocs.length) && <small className="text-muted">Select a client first to see SPOCs</small>}
              </div>
              
              <div className="mb-3">
                <label className="form-label">Overall Project Delivery Date & Time</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={newProject.endDate} 
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })} 
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Brief Received On</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={newProject.briefReceivedOn} 
                  onChange={(e) => setNewProject({ ...newProject, briefReceivedOn: e.target.value })} 
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Project Estimated Time (hours)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Enter estimated time in hours"
                  value={newProject.estimatedTime} 
                  onChange={(e) => setNewProject({ ...newProject, estimatedTime: e.target.value })} 
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isLoading}
                style={{ 
                  backgroundColor: '#007bff',
                  borderColor: '#007bff',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: '600'
                }}
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
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ color: '#273C63', fontWeight: '600' }}>Name</th>
                      <th style={{ color: '#273C63', fontWeight: '600' }}>Client</th>
                      <th style={{ color: '#273C63', fontWeight: '600' }}>Status</th>
                      <th style={{ color: '#273C63', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td>
                          <div className="fw-semibold" style={{ color: '#273C63' }}>{p.name}</div>
                        </td>
                        <td>
                          <span className="text-muted">{p.client.name}</span>
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
                            <i className="fas fa-eye me-1"></i>
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
                            <i className="fas fa-edit me-1"></i>
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            style={{ borderRadius: '6px' }}
                          >
                            <i className="fas fa-trash me-1"></i>
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
    </ProjectsLayout>
  );
};

export default Projects;

