import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // For admin endpoints, use x-auth-token header
    if (config.url?.includes('/admin/')) {
      config.headers['x-auth-token'] = token;
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface Project {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  client: {
    id: number;
    name: string;
  };
  manager?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  projectCode?: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  actualHours?: number;
  budgetAmount?: number;
  spentAmount?: number;
  currency?: string;
  billingType?: 'hourly' | 'fixed' | 'milestone';
  hourlyRate?: number;
  isTimeTrackingEnabled?: boolean;
  isBillable?: boolean;
  tags?: string[];
  notes?: string;
  spocId?: number;
  spoc?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    designation?: string;
    department?: string;
  };
  briefReceivedOn?: string;
  estimatedTime?: number;
  teamNotes?: string;
  objectives?: string;
  deliverables?: string;
  attachments?: ProjectAttachment[];
  clientLinks?: string;
  // Backend-computed counts for list view
  tasksCount?: number;
  openTasksCount?: number;
  membersCount?: number;
  // Additional properties for detailed view fallback
  teamMembers?: Array<{
    taskName?: string;
    assignedTo?: {
      firstName?: string;
      lastName?: string;
      department?: string;
    };
  }>;
  tasks?: string[];
  documents?: Array<{
    filename: string;
    originalName: string;
    filePath: string;
  }>;
}

export interface ProjectAttachment {
  id?: number;
  filename: string;
  originalName: string;
  fileType: 'brief' | 'brand_guideline' | 'reference';
  fileSize: number;
  uploadedAt?: string;
}

export interface ProjectDetails {
  teamNotes?: string;
  objectives?: string;
  deliverables?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical' | string;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | string;
  clientLinks?: string;
  managerId?: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  clientId: number;
  managerId?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface UpdateProjectData extends CreateProjectData {
  id: number;
}

class ProjectService {
  // Get all projects
  async getProjects(): Promise<Project[]> {
    try {
      const response = await api.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  // Get a single project
  async getProject(id: number): Promise<Project> {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  // Create a new project
  async createProject(projectData: CreateProjectData): Promise<{ message: string; project: any }> {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Update a project
  async updateProject(id: number, projectData: Partial<CreateProjectData>): Promise<{ message: string }> {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  // Delete a project
  async deleteProject(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Update project details (specifications, team notes, etc.)
  async updateProjectDetails(id: number, details: ProjectDetails): Promise<{ message: string }> {
    try {
      const response = await api.put(`/projects/${id}/details`, details);
      return response.data;
    } catch (error) {
      console.error('Error updating project details:', error);
      throw error;
    }
  }

  // Upload project files
  async uploadProjectFiles(id: number, files: FormData): Promise<{ message: string; attachments: ProjectAttachment[] }> {
    try {
      const response = await api.post(`/projects/${id}/upload`, files, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading project files:', error);
      throw error;
    }
  }

  // Get project files
  async getProjectFiles(id: number): Promise<ProjectAttachment[]> {
    try {
      const response = await api.get(`/projects/${id}/files`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project files:', error);
      throw error;
    }
  }

  // Get all users for team assignment
  async getUsers(): Promise<Array<{ id: number; firstname: string; lastname: string; email: string; department?: string; designation?: string; role?: string }>> {
    try {
      const response = await api.get('/projects/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get all managers for dropdown
  async getManagers(): Promise<Array<{ id: number; first_name: string; last_name: string; email: string }>> {
    try {
      const response = await api.get('/projects/managers');
      return response.data;
    } catch (error) {
      console.error('Error fetching managers:', error);
      throw error;
    }
  }

  // Close a project (PM or AM only; backend enforces task completion)
  async closeProject(id: number, reason?: string): Promise<{ message: string; project: Project }> {
    try {
      const response = await api.post(`/projects/${id}/close`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error closing project:', error);
      throw error;
    }
  }
}

export default new ProjectService();
