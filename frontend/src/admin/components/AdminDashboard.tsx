import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthService } from '../services/admin-auth.service';
import { getDashboardStats } from '../services/admin-api.service';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import ClientManagement from './ClientManagement';
import ProjectManagement from './ProjectManagement';
import '../styles/AdminDashboard.css';

interface DashboardStats {
  totalUsers: number;
  totalRoles: number;
  totalClients: number;
  totalProjects: number;
  activeUsers: number;
  inactiveUsers: number;
}

type ActiveTab = 'dashboard' | 'users' | 'roles' | 'clients' | 'projects';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminAuthService.isLoggedIn()) {
      navigate('/admin/login');
      return;
    }

    fetchDashboardStats();
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/admin/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'clients':
        return <ClientManagement />;
      case 'projects':
        return <ProjectManagement />;
      default:
        return (
          <div className="dashboard-content">
            <h2>Dashboard Overview</h2>
            {isLoading ? (
              <div className="loading">Loading dashboard stats...</div>
            ) : stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon users-icon">👥</div>
                  <div className="stat-details">
                    <h3>{stats.totalUsers}</h3>
                    <p>Total Users</p>
                    <span className="stat-subtitle">{stats.activeUsers} active</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon roles-icon">🔐</div>
                  <div className="stat-details">
                    <h3>{stats.totalRoles}</h3>
                    <p>Total Roles</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon clients-icon">🏢</div>
                  <div className="stat-details">
                    <h3>{stats.totalClients}</h3>
                    <p>Total Clients</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon projects-icon">📋</div>
                  <div className="stat-details">
                    <h3>{stats.totalProjects}</h3>
                    <p>Total Projects</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="error">Failed to load dashboard stats</div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button
            className={activeTab === 'roles' ? 'active' : ''}
            onClick={() => setActiveTab('roles')}
          >
            🔐 Roles
          </button>
          <button
            className={activeTab === 'clients' ? 'active' : ''}
            onClick={() => setActiveTab('clients')}
          >
            🏢 Clients
          </button>
          <button
            className={activeTab === 'projects' ? 'active' : ''}
            onClick={() => setActiveTab('projects')}
          >
            📋 Projects
          </button>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="admin-main">
        <div className="admin-header">
          <h1>Administration Panel</h1>
        </div>
        <div className="admin-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;
