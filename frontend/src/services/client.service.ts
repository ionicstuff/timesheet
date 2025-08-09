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
    config.headers.Authorization = `Bearer ${token}`;
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

export interface Client {
  id: number;
  clientCode: string;
  clientName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  industry?: string;
  accountManagerId?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  status: 'active' | 'inactive' | 'prospect' | 'closed';
  billingType?: 'hourly' | 'fixed' | 'monthly' | 'project';
  hourlyRate?: number;
  currency: string;
  notes?: string;
  isActive: boolean;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  accountManager?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  projects?: Array<{
    id: number;
    projectName: string;
    status: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export interface CreateClientRequest {
  clientCode?: string;
  clientName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  industry?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  status?: 'active' | 'inactive' | 'prospect' | 'closed';
  billingType?: 'hourly' | 'fixed' | 'monthly' | 'project';
  hourlyRate?: number;
  currency?: string;
  notes?: string;
  spocEmail?: string; // Added SPOC email field
}

export interface UpdateClientRequest {
  clientCode?: string;
  clientName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  industry?: string;
  accountManagerId?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  status?: 'active' | 'inactive' | 'prospect' | 'closed';
  billingType?: 'hourly' | 'fixed' | 'monthly' | 'project';
  hourlyRate?: number;
  currency?: string;
  notes?: string;
}

class ClientService {
  // Get clients for the current user
  async getUserClients(filters?: { search?: string; industry?: string; status?: string }): Promise<Client[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.industry) params.append('industry', filters.industry);
      if (filters?.status) params.append('status', filters.status);
      
      const response = await api.get(`/clients?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user clients:', error);
      throw error;
    }
  }

  // Get all clients (for dropdowns, etc.)
  async getAllClients(): Promise<Client[]> {
    try {
      const response = await api.get('/clients/all');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching all clients:', error);
      throw error;
    }
  }

  // Get client by ID
  async getClientById(id: number): Promise<Client> {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  }

  // Create a new client
  async createClient(clientData: CreateClientRequest): Promise<Client> {
    try {
      const response = await api.post('/clients', clientData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Update a client
  async updateClient(id: number, clientData: UpdateClientRequest): Promise<Client> {
    try {
      const response = await api.put(`/clients/${id}`, clientData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  // Get list of industries
  async getIndustries(): Promise<string[]> {
    try {
      const response = await api.get('/clients/industries');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching industries:', error);
      throw error;
    }
  }

}

export default new ClientService();
