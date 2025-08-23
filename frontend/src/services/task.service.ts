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

export interface Task {
  id?: number;
  projectId: number;
  name: string;
  description?: string;
  assignedTo?: number;
  estimatedTime: number;
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  acceptanceStatus?: 'pending' | 'accepted' | 'rejected';
  acceptedAt?: string;
  rejectionReason?: string;
  startedAt?: string;
  completedAt?: string;
  totalTrackedSeconds?: number;
  activeTimerStartedAt?: string;
  lastPausedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  project?: {
    id: number;
    projectName: string;
    projectCode: string;
  };
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateTaskData {
  projectId: number;
  name: string;
  description?: string;
  assignedTo?: number;
  estimatedTime: number;
}

export interface UpdateTaskData {
  name?: string;
  description?: string;
  assignedTo?: number;
  estimatedTime?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

class TaskService {
  // Timer endpoints
  async start(id: number, note?: string): Promise<{ message: string; task: Task }> {
    const response = await api.post(`/tasks/${id}/start`, note ? { note } : {});
    return response.data;
  }
  async pause(id: number, note?: string): Promise<{ message: string; task: Task }> {
    const response = await api.post(`/tasks/${id}/pause`, note ? { note } : {});
    return response.data;
  }
  async resume(id: number, note?: string): Promise<{ message: string; task: Task }> {
    const response = await api.post(`/tasks/${id}/resume`, note ? { note } : {});
    return response.data;
  }
  async stop(id: number, note?: string): Promise<{ message: string; task: Task }> {
    const response = await api.post(`/tasks/${id}/stop`, note ? { note } : {});
    return response.data;
  }
  async complete(id: number, note?: string): Promise<{ message: string; task: Task }> {
    const response = await api.post(`/tasks/${id}/complete`, note ? { note } : {});
    return response.data;
  }
  async getLogs(id: number) {
    const response = await api.get(`/tasks/${id}/logs`);
    return response.data;
  }

  async getTasks(filters?: {
    projectId?: number;
    assignedTo?: number;
    status?: string;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId.toString());
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo.toString());
    if (filters?.status) params.append('status', filters.status);
    
    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  }

  async getTask(id: number): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(taskData: CreateTaskData): Promise<{ message: string; task: Task }> {
    const response = await api.post('/tasks', taskData);
    return response.data;
  }

  async updateTask(id: number, taskData: UpdateTaskData): Promise<{ message: string; task: Task }> {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }

  async acceptTask(id: number): Promise<{ message: string; task: Task }> {
    const response = await api.put(`/tasks/${id}/accept`);
    return response.data;
  }

  async rejectTask(id: number, reason: string): Promise<{ message: string; task: Task }> {
    const response = await api.put(`/tasks/${id}/reject`, { rejectionReason: reason });
    return response.data;
  }

  async getMyTasks(filters?: {
    status?: string;
    acceptanceStatus?: string;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.acceptanceStatus) params.append('acceptanceStatus', filters.acceptanceStatus);
    
    const response = await api.get(`/tasks/my-tasks?${params.toString()}`);
    return response.data;
  }
}

export default new TaskService();
