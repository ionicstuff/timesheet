import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with interceptors (consistent with other services)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    if (config.url?.includes('/admin/')) {
      (config.headers as any)['x-auth-token'] = token;
    } else {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  body?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt?: string; // derived from created_at
  created_at?: string; // raw column (backend adds createdAt too)
}

class NotificationService {
  async list(params?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<{ items: NotificationItem[] }> {
    const search = new URLSearchParams();
    if (params?.limit) search.append('limit', String(params.limit));
    if (params?.offset) search.append('offset', String(params.offset));
    if (params?.unreadOnly) search.append('unreadOnly', '1');
    const resp = await api.get(`/notifications${search.toString() ? `?${search.toString()}` : ''}`);
    return resp.data;
  }

  async unreadCount(): Promise<{ count: number }> {
    const resp = await api.get('/notifications/unread-count');
    return resp.data;
  }

  async markRead(id: number): Promise<{ success: boolean }> {
    const resp = await api.post(`/notifications/${id}/read`);
    return resp.data;
  }

  async markAllRead(): Promise<{ success: boolean; updated: number }> {
    const resp = await api.post('/notifications/read-all');
    return resp.data;
  }
}

export default new NotificationService();

