import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Axios instance mirroring other services
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SpocPayload {
  name: string;
  email: string;
  clientId: number;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface Spoc {
  id: number;
  name: string;
  email: string;
}

class SpocService {
  async getByClient(clientId: number): Promise<Spoc[]> {
    const res = await api.get(`/spocs/client/${clientId}`);
    return res.data.data || [];
  }

  async create(data: SpocPayload): Promise<Spoc> {
    const res = await api.post('/spocs', data);
    // some routes wrap in {success,data}; return either
    return res.data.data || res.data;
  }
}

export default new SpocService();

