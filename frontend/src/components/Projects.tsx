import React, { useState, useEffect } from "react";
import "./Projects.css"; // Assuming you have a CSS file for styling
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProjectService, {
  Project,
  CreateProjectData,
} from "../services/project.service";
import ProjectsLayout from "./ProjectsLayout";
import ClientService from "../services/client.service"; // Assuming a client service exists
import AdminService from "../services/admin.service"; // Assuming an admin service for users
import axios from "axios";

// Dynamic CSS injection for dark theme (similar to OnboardClient.tsx)
const projectsFormStyle = document.createElement("style");
projectsFormStyle.textContent = `
  .projects-container {
    background-color: var(--primary-bg) !important;
    min-height: 100vh;
    color: var(--text-primary) !important;
    padding: 20px;
  }
  
  .projects-card {
    background-color: var(--card-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .projects-table {
    background-color: var(--card-bg) !important;
    color: var(--text-primary) !important;
  }
  
  .projects-table th {
    background-color: var(--secondary-bg) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--border-color) !important;
    font-weight: 600;
    font-size: 12px;
    padding: 12px;
  }
  
  .projects-table td {
    background-color: var(--card-bg) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--border-color) !important;
    padding: 12px;
  }
  
  .projects-table tbody tr {
    background-color: var(--card-bg) !important;
  }
  
  .projects-table tbody tr:hover {
    background-color: var(--secondary-bg) !important;
  }
  
  .projects-table tbody tr:hover td {
    background-color: var(--secondary-bg) !important;
    color: var(--text-primary) !important;
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
    color: var(--text-primary) !important;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .projects-btn-primary {
    background-color: var(--accent-blue) !important;
    border-color: var(--accent-blue) !important;
    color: white !important;
    border-radius: 8px;
    padding: 10px 24px;
    font-weight: 600;
  }
  
  .projects-nav-tabs {
    border-bottom: 1px solid var(--border-color) !important;
  }
  
  .projects-nav-tabs .nav-link {
    color: var(--text-secondary) !important;
    border: none;
    background: transparent;
  }
  
  .projects-nav-tabs .nav-link.active {
    color: var(--text-primary) !important;
    background-color: var(--card-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-bottom-color: var(--card-bg) !important;
  }
  
  /* Override Bootstrap table styles completely */
  .projects-container .table {
    --bs-table-bg: var(--card-bg) !important;
    --bs-table-color: var(--text-primary) !important;
    --bs-table-border-color: var(--border-color) !important;
    --bs-table-hover-bg: var(--secondary-bg) !important;
    --bs-table-hover-color: var(--text-primary) !important;
    background-color: var(--card-bg) !important;
    color: var(--text-primary) !important;
  }
  
  .projects-container .table > :not(caption) > * > * {
    background-color: var(--card-bg) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
  }
  
  .projects-container .table-responsive {
    background-color: var(--card-bg) !important;
  }
  
  .projects-container .card {
    background-color: var(--card-bg) !important;
    border-color: var(--border-color) !important;
  }
  
  .projects-container .card-body {
    background-color: var(--card-bg) !important;
  }
`;
document.head.appendChild(projectsFormStyle);

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
  const [activeTab, setActiveTab] = useState<"create" | "existing">("existing");
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientWithSpocs[]>([]);
  const [spocs, setSpocs] = useState<Spoc[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newProject, setNewProject] = useState({
    name: "",
    clientId: 0,
    spocId: 0,
    endDate: "",
    briefReceivedOn: "",
    estimatedTime: "",
  });

  useEffect(() => {
    fetchClientsAndManagers();
    if (activeTab === "existing") {
      fetchProjects();
    }
  }, [activeTab]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const fetchedProjects = await ProjectService.getProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      setError("Error fetching projects");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientsAndManagers = async () => {
    // Fetch clients with SPOCs
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/api/client-management/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response:", response.data);
      console.log("Clients data:", response.data.data);
      setClients(response.data.data || []);
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      setError(`Error fetching clients: ${err.message || "Unknown error"}`);
    }

    // Fetch users/managers separately
    try {
      const fetchedUsers = await AdminService.getUsers();
      setManagers(
        fetchedUsers.users.filter(
          (u: any) => u.role === "manager" || u.role === "admin"
        )
      );
    } catch (err: any) {
      console.error("Error fetching users:", err);
      // Don't set error for managers as it's not critical for client dropdown
    }
  };

  const handleClientChange = (clientId: number) => {
    console.log("Selected client ID:", clientId);
    console.log("Available clients:", clients);
    setNewProject({ ...newProject, clientId, spocId: 0 });
    const client = clients.find((c) => c.id === clientId);
    console.log("Found client:", client);
    if (client) {
      console.log("Client SPOCs:", client.spocs);
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
        estimatedTime: newProject.estimatedTime
          ? parseFloat(newProject.estimatedTime)
          : undefined,
      };
      await ProjectService.createProject(projectData as any);
      setNewProject({
        name: "",
        clientId: 0,
        spocId: 0,
        endDate: "",
        briefReceivedOn: "",
        estimatedTime: "",
      });
      setSpocs([]);
      setActiveTab("existing");
    } catch (err) {
      setError("Error creating project");
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
      <div className="projects-container">
        <h2
          className="fw-bold mb-4"
          style={{ color: "var(--text-primary)", marginBottom: "16px" }}
        >
          Project Management
        </h2>

        <ul className="nav nav-tabs projects-nav-tabs mb-4">
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === "existing" ? "active" : ""}`}
              href="#"
              onClick={() => setActiveTab("existing")}
            >
              Existing Projects
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === "create" ? "active" : ""}`}
              href="#"
              onClick={() => setActiveTab("create")}
            >
              Create New Project
            </a>
          </li>
        </ul>

        {error && (
          <div
            className="alert"
            style={{
              backgroundColor: "rgba(220, 53, 69, 0.1)",
              borderColor: "var(--danger-color)",
              color: "var(--danger-color)",
              borderRadius: "8px",
              padding: "12px 16px",
            }}
          >
            {error}
          </div>
        )}

        {activeTab === "create" && (
          <div className="card border-0 shadow-sm projects-card">
            <div className="card-body">
              <h5
                className="card-title fw-bold card-title-projects"
                style={{ color: "var(--text-primary)", marginBottom: "16px" }}
              >
                <i
                  className="fas fa-plus-circle me-2"
                  style={{ color: "#4F7BFF" }}
                ></i>
                Create New Project
              </h5>
              <form
                onSubmit={handleCreateProject}
                style={{ backgroundColor: "#2a2a2a" }}
              >
                <div className="mb-3">
                  <label className="form-label projects-form-label">
                    Project Name
                  </label>
                  <input
                    type="text"
                    className="form-control projects-form-control"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label projects-form-label">
                    Client
                  </label>
                  <select
                    className="form-select projects-form-control"
                    value={newProject.clientId}
                    onChange={(e) => handleClientChange(+e.target.value)}
                    required
                  >
                    <option value={0} disabled>
                      Select Client
                    </option>
                    {clients &&
                      clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.clientName}
                        </option>
                      ))}
                  </select>
                  <small
                    style={{ color: "var(--text-secondary)", fontSize: "11px" }}
                  >
                    Clients loaded: {clients ? clients.length : 0}
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label projects-form-label">
                    Client SPOC
                  </label>
                  <select
                    className="form-select projects-form-control"
                    value={newProject.spocId}
                    onChange={(e) =>
                      setNewProject({ ...newProject, spocId: +e.target.value })
                    }
                    required
                    disabled={!spocs || !spocs.length}
                  >
                    <option value={0} disabled>
                      Select Client SPOC
                    </option>
                    {spocs &&
                      spocs.map((spoc) => (
                        <option key={spoc.id} value={spoc.id}>
                          {spoc.name} ({spoc.email})
                        </option>
                      ))}
                  </select>
                  {(!spocs || !spocs.length) && (
                    <small
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "11px",
                      }}
                    >
                      Select a client first to see SPOCs
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label projects-form-label">
                    Overall Project Delivery Date & Time
                  </label>
                  <input
                    type="date"
                    className="form-control projects-form-control"
                    value={newProject.endDate}
                    onChange={(e) =>
                      setNewProject({ ...newProject, endDate: e.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label projects-form-label">
                    Brief Received On
                  </label>
                  <input
                    type="date"
                    className="form-control projects-form-control"
                    value={newProject.briefReceivedOn}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        briefReceivedOn: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label projects-form-label">
                    Project Estimated Time (hours)
                  </label>
                  <input
                    type="number"
                    className="form-control projects-form-control"
                    placeholder="Enter estimated time in hours"
                    value={newProject.estimatedTime}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        estimatedTime: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="btn projects-btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
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

        {activeTab === "existing" && (
          <div className="card border-0 shadow-sm projects-card">
            <div className="card-body">
              <h5
                className="card-title fw-bold mb-4 card-title-projects"
                style={{ color: "var(--text-primary)", marginBottom: "16px" }}
              >
                <i
                  className="fas fa-list me-2"
                  style={{ color: "#4F7BFF" }}
                ></i>
                All Projects
              </h5>
              {isLoading ? (
                <p style={{ color: "var(--text-primary)" }}>
                  Loading projects...
                </p>
              ) : (
                <div
                  className="table-responsive"
                  style={{ backgroundColor: "#2a2a2a" }}
                >
                  <table
                    className="table table-hover align-middle projects-table"
                    style={{
                      backgroundColor: "#2a2a2a",
                      color: "#f5f5f5",
                      border: "none",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            backgroundColor: "#2d2d2d",
                            color: "#f5f5f5",
                            border: "1px solid #404040",
                          }}
                        >
                          Name
                        </th>
                        <th
                          style={{
                            backgroundColor: "#2d2d2d",
                            color: "#f5f5f5",
                            border: "1px solid #404040",
                          }}
                        >
                          Client
                        </th>
                        <th
                          style={{
                            backgroundColor: "#2d2d2d",
                            color: "#f5f5f5",
                            border: "1px solid #404040",
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            backgroundColor: "#2d2d2d",
                            color: "#f5f5f5",
                            border: "1px solid #404040",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p) => (
                        <tr key={p.id} style={{ backgroundColor: "#2a2a2a" }}>
                          <td
                            style={{
                              backgroundColor: "#2a2a2a",
                              color: "#f5f5f5",
                              border: "1px solid #404040",
                            }}
                          >
                            <div
                              style={{ color: "#f5f5f5", fontWeight: "600" }}
                            >
                              {p.name}
                            </div>
                          </td>
                          <td
                            style={{
                              backgroundColor: "#2a2a2a",
                              color: "#f5f5f5",
                              border: "1px solid #404040",
                            }}
                          >
                            <span
                              style={{ color: "#b3b3b3", fontSize: "14px" }}
                            >
                              {p.client.name}
                            </span>
                          </td>
                          <td
                            style={{
                              backgroundColor: "#2a2a2a",
                              color: "#f5f5f5",
                              border: "1px solid #404040",
                            }}
                          >
                            <span
                              className="badge"
                              style={{
                                fontSize: "11px",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                backgroundColor: p.isActive
                                  ? "#28a745"
                                  : "#6c757d",
                                color: "white",
                              }}
                            >
                              {p.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td
                            style={{
                              backgroundColor: "#2a2a2a",
                              color: "#f5f5f5",
                              border: "1px solid #404040",
                            }}
                          >
                            <button
                              className="btn btn-sm me-2"
                              style={{
                                backgroundColor: "#4F7BFF",
                                borderColor: "#4F7BFF",
                                color: "white",
                                fontSize: "12px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                marginRight: "8px",
                              }}
                              onClick={() => handleViewProjectDetails(p.id)}
                            >
                              <i className="fas fa-eye me-1"></i>
                              View
                            </button>
                            <button
                              className="btn btn-sm me-2"
                              style={{
                                backgroundColor: "#17a2b8",
                                borderColor: "#17a2b8",
                                color: "white",
                                fontSize: "12px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                marginRight: "8px",
                              }}
                              onClick={() => handleEditProjectDetails(p.id)}
                            >
                              <i className="fas fa-edit me-1"></i>
                              Edit
                            </button>
                            <button
                              className="btn btn-sm me-2"
                              style={{
                                backgroundColor: "#ffc107",
                                borderColor: "#ffc107",
                                color: "#212529",
                                fontSize: "12px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                marginRight: "8px",
                              }}
                              onClick={async ()=>{
                                // Auto-close without prompts if there are no tasks or no open tasks
                                const tasksCount = (p as any).tasksCount ?? ((p as any).tasks?.length ?? 0);
                                const openTasks = (p as any).openTasksCount ?? (tasksCount > 0 ? tasksCount : 0);
                                if (tasksCount === 0 || openTasks === 0) {
                                  try { await ProjectService.closeProject(p.id as any); fetchProjects(); }
                                  catch(err:any){ alert(err?.response?.data?.message || err?.message || 'Failed to close project'); }
                                  return;
                                }
                                // Otherwise confirm
                                if(!window.confirm(`This project has ${openTasks} open task(s). You can only close a project when all tasks are completed. Do you want to try closing anyway?`)) return;
                                try{ await ProjectService.closeProject(p.id as any); fetchProjects(); }
                                catch(err:any){ alert(err?.response?.data?.message || err?.message || 'Failed to close project'); }
                              }}
                            >
                              <i className="fas fa-check-circle me-1"></i>
                              Close
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "#dc3545",
                                borderColor: "#dc3545",
                                color: "white",
                                fontSize: "12px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontWeight: "600",
                              }}
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
      </div>
    </ProjectsLayout>
  );
};

export default Projects;
