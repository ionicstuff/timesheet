import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Profile interfaces
export interface UserProfileBasicInfo {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePicture?: string;
}

export interface UserProfileProfessionalInfo {
  department: string;
  designation: string;
  dateOfJoining: string;
  role: string;
  roleDetails: {
    id: number;
    roleCode: string;
    roleName: string;
    description: string;
    level: number;
  };
  isActive: boolean;
  yearsOfService: number;
}

export interface UserProfileHierarchyInfo {
  manager: {
    hierarchyLevel: number;
    relationshipType: string;
    managerDetails: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      designation: string;
      department: string;
    };
    effectiveFrom: string;
  } | null;
  directReports: Array<{
    userId: number;
    name: string;
    email: string;
    designation: string;
    department: string;
    hierarchyLevel: number;
    relationshipType: string;
    effectiveFrom: string;
  }>;
}

export interface UserProfileManagementInfo {
  managedClients: Array<{
    id: number;
    clientName: string;
    email: string;
    status: string;
    industry: string;
    contactPerson: string;
  }>;
  managedProjects: Array<{
    id: number;
    projectName: string;
    status: string;
    startDate: string;
    endDate: string;
    budget: number;
    description: string;
  }>;
}

export interface UserProfileStatistics {
  directReports: number;
  managedClientsCount: number;
  managedProjectsCount: number;
  yearsOfService: number;
}

export interface UserProfileAccountInfo {
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface UserProfileData {
  basicInfo: UserProfileBasicInfo;
  professionalInfo: UserProfileProfessionalInfo;
  hierarchyInfo: UserProfileHierarchyInfo;
  managementInfo: UserProfileManagementInfo;
  statistics: UserProfileStatistics;
  accountInfo: UserProfileAccountInfo;
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: UserProfileData;
}

export interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  designation?: string;
  profilePicture?: string;
}

class UserService {
  
  async getMyTeamMembers(params?: { search?: string; includeSubordinates?: boolean; page?: number; limit?: number; }): Promise<TeamMember[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.includeSubordinates) query.append('includeSubordinates', String(params.includeSubordinates));
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const resp = await api.get(`/users/team${query.toString() ? `?${query.toString()}` : ''}`);
    // Backend returns { success, data: { teamMembers, pagination } }
    if (resp.data?.data?.teamMembers) {
      return resp.data.data.teamMembers.map((u: any) => ({
        id: u.id,
        firstName: u.firstName || u.firstname || '',
        lastName: u.lastName || u.lastname || '',
        email: u.email,
        department: u.department,
        designation: u.designation,
        profilePicture: u.profilePicture,
      }));
    }
    // Fallback to raw array
    return Array.isArray(resp.data) ? resp.data : [];
  }

  async getUserProfile(): Promise<UserProfileData> {
    try {
      const response = await api.get<UserProfileResponse>('/users/profile');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user profile');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch user profile');
    }
  }

  async updateProfile(profileData: Partial<UserProfileBasicInfo & UserProfileProfessionalInfo>): Promise<UserProfileData> {
    try {
      // Get current user to get the user ID
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await api.put<UserProfileResponse>(`/users/${currentUser.id}`, profileData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update user profile');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update user profile');
    }
  }

  // Helper methods for profile data formatting
  formatYearsOfService(years: number): string {
    if (years === 0) return 'Less than a year';
    if (years === 1) return '1 year';
    return `${years} years`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getProfileImageUrl(profilePicture?: string): string {
    if (profilePicture) {
      // Return full URL if it's already a complete URL
      if (profilePicture.startsWith('http')) {
        return profilePicture;
      }
      // Otherwise construct URL from API base
      return `${API_URL}/uploads/profiles/${profilePicture}`;
    }
    return '';
  }

  getDepartmentColor(department: string): string {
    const colors: { [key: string]: string } = {
      'Engineering': '#007bff',
      'Design': '#28a745',
      'Marketing': '#ffc107',
      'Sales': '#dc3545',
      'HR': '#6f42c1',
      'Finance': '#fd7e14',
      'Operations': '#20c997',
      'IT': '#17a2b8',
      'Legal': '#6c757d',
      'Default': '#495057'
    };
    return colors[department] || colors.Default;
  }

  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      'admin': '#dc3545',
      'hr': '#6f42c1',
      'manager': '#007bff',
      'account_manager': '#28a745',
      'employee': '#17a2b8',
      'Default': '#6c757d'
    };
    return colors[role] || colors.Default;
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? '#28a745' : '#dc3545';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }
}

export default new UserService();
