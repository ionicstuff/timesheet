import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance for admin API calls
const adminApi = axios.create({
  baseURL: `${API_URL}/admin`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Dashboard
export const getDashboardStats = async () => {
  const response = await adminApi.get('/dashboard/stats');
  return response.data;
};

// Role Management
export const getRoles = async () => {
  const response = await adminApi.get('/roles');
  return response.data;
};

export const createRole = async (roleData: any) => {
  const response = await adminApi.post('/roles', roleData);
  return response.data;
};

export const updateRole = async (id: string, roleData: any) => {
  const response = await adminApi.put(`/roles/${id}`, roleData);
  return response.data;
};

export const deleteRole = async (id: string) => {
  const response = await adminApi.delete(`/roles/${id}`);
  return response.data;
};

// User Management
export const getUsers = async () => {
  const response = await adminApi.get('/users');
  return response.data;
};

export const getUser = async (id: string) => {
  const response = await adminApi.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData: any) => {
  const response = await adminApi.post('/users', userData);
  return response.data;
};

export const updateUser = async (id: string, userData: any) => {
  const response = await adminApi.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await adminApi.delete(`/users/${id}`);
  return response.data;
};

// Permission and Module Management
export const getPermissions = async () => {
  const response = await adminApi.get('/permissions');
  return response.data;
};

export const getModules = async () => {
  const response = await adminApi.get('/modules');
  return response.data;
};

// Client Management
export const getClients = async () => {
  const response = await adminApi.get('/clients');
  return response.data;
};

export const createClient = async (clientData: any) => {
  const response = await adminApi.post('/clients', clientData);
  return response.data;
};

export const updateClient = async (id: string, clientData: any) => {
  const response = await adminApi.put(`/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id: string) => {
  const response = await adminApi.delete(`/clients/${id}`);
  return response.data;
};

// Project Management
export const getProjects = async () => {
  const response = await adminApi.get('/projects');
  return response.data;
};

export const createProject = async (projectData: any) => {
  const response = await adminApi.post('/projects', projectData);
  return response.data;
};

export const updateProject = async (id: string, projectData: any) => {
  const response = await adminApi.put(`/projects/${id}`, projectData);
  return response.data;
};

export const deleteProject = async (id: string) => {
  const response = await adminApi.delete(`/projects/${id}`);
  return response.data;
};

// Departments and Designations
export const getDepartments = async () => {
  const response = await adminApi.get('/departments');
  return response.data;
};

export const getDesignations = async () => {
  const response = await adminApi.get('/designations');
  return response.data;
};
