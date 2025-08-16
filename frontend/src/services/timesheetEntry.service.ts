import axios from 'axios';

export interface TimesheetEntry {
  id: number;
  timesheetId: number;
  projectId: number;
  taskId?: number | null;
  minutes: number;
  isBillable: boolean;
  description?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
}

export interface ListResponse {
  timesheetId: number;
  entries: TimesheetEntry[];
  totalMinutes: number;
}

class TimesheetEntryService {
  private baseURL: string;
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  }
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async list(date: string) {
    const res = await axios.get(`${this.baseURL}/timesheet-entries`, {
      headers: this.getAuthHeader(),
      params: { date }
    });
    return res.data;
  }

  async create(payload: { date: string; projectId: number; taskId?: number | null; minutes: number; isBillable?: boolean; description?: string }) {
    const res = await axios.post(`${this.baseURL}/timesheet-entries`, payload, {
      headers: this.getAuthHeader()
    });
    return res.data;
  }

  async update(id: number, payload: Partial<{ projectId: number; taskId: number | null; minutes: number; isBillable: boolean; description: string }>) {
    const res = await axios.patch(`${this.baseURL}/timesheet-entries/${id}`, payload, {
      headers: this.getAuthHeader()
    });
    return res.data;
  }

  async remove(id: number) {
    const res = await axios.delete(`${this.baseURL}/timesheet-entries/${id}`, {
      headers: this.getAuthHeader()
    });
    return res.data;
  }

  async submitDay(date: string) {
    const res = await axios.post(`${this.baseURL}/timesheet-entries/submit`, { date }, {
      headers: this.getAuthHeader()
    });
    return res.data;
  }
}

export default new TimesheetEntryService();
