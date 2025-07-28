import axios from 'axios';

// Types
export interface TimesheetStatus {
  id?: number;
  date?: string;
  status: 'not_clocked_in' | 'clocked_in' | 'clocked_out';
  clockInTime: string | null;
  clockOutTime: string | null;
  totalHours: number;
  requiredHours: number;
  breakDuration: number;
  overtimeHours: number;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class TimesheetService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  }

  // Get authorization header
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Clock In
  async clockIn(location?: string): Promise<ApiResponse<TimesheetStatus>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/timesheet/clockin`,
        { location },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Clock in error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to clock in'
      );
    }
  }

  // Clock Out
  async clockOut(): Promise<ApiResponse<TimesheetStatus>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/timesheet/clockout`,
        {},
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Clock out error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to clock out'
      );
    }
  }

  // Get current timesheet status
  async getTimesheetStatus(): Promise<TimesheetStatus> {
    try {
      const response = await axios.get(
        `${this.baseURL}/timesheet/status`,
        { headers: this.getAuthHeader() }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Get status error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to get timesheet status'
      );
    }
  }

  // Format time for display (HH:MM format)
  static formatTime(timeString: string | null): string {
    if (!timeString) return '--:--';
    
    try {
      // Handle both HH:MM:SS and HH:MM formats
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        return `${timeParts[0]}:${timeParts[1]}`;
      }
      return timeString;
    } catch (error) {
      return '--:--';
    }
  }

  // Format hours for display (H.HH format)
  static formatHours(hours: number): string {
    if (hours === 0 || !hours) return '0.00';
    return hours.toFixed(2);
  }

  // Calculate current working hours (for real-time display)
  static calculateCurrentHours(clockInTime: string | null): number {
    if (!clockInTime) return 0;

    try {
      const now = new Date();
      const clockIn = new Date();
      
      // Parse clock in time (assuming HH:MM:SS format)
      const timeParts = clockInTime.split(':');
      clockIn.setHours(parseInt(timeParts[0]));
      clockIn.setMinutes(parseInt(timeParts[1]));
      clockIn.setSeconds(parseInt(timeParts[2] || '0'));

      // Calculate difference in hours
      const diffMs = now.getTime() - clockIn.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      return Math.max(0, diffHours);
    } catch (error) {
      console.error('Error calculating current hours:', error);
      return 0;
    }
  }

  // Get current time for display
  static getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Check if user is currently clocked in
  static isClockedIn(status: TimesheetStatus): boolean {
    return status.status === 'clocked_in';
  }

  // Check if user has completed work for the day
  static isWorkComplete(status: TimesheetStatus): boolean {
    return status.status === 'clocked_out';
  }

  // Get status color for UI
  static getStatusColor(status: TimesheetStatus): string {
    switch (status.status) {
      case 'clocked_in':
        return '#28A745'; // Green
      case 'clocked_out':
        return '#6C757D'; // Gray
      default:
        return '#DC3545'; // Red
    }
  }

  // Get status text for UI
  static getStatusText(status: TimesheetStatus): string {
    switch (status.status) {
      case 'clocked_in':
        return 'Clocked In';
      case 'clocked_out':
        return 'Clocked Out';
      default:
        return 'Not Clocked In';
    }
  }

  // Get next action text for button
  static getNextActionText(status: TimesheetStatus): string {
    return status.status === 'clocked_in' ? 'Clock Out' : 'Clock In';
  }
}

export default new TimesheetService();
