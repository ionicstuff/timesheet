import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

// Custom CSS for white placeholder
const customStyle = document.createElement('style');
customStyle.textContent = `
  .white-placeholder::placeholder {
    color: rgba(255, 255, 255, 0.7) !important;
    opacity: 1;
  }
  .white-placeholder::-webkit-input-placeholder {
    color: rgba(255, 255, 255, 0.7) !important;
  }
  .white-placeholder::-moz-placeholder {
    color: rgba(255, 255, 255, 0.7) !important;
  }
  .white-placeholder:-ms-input-placeholder {
    color: rgba(255, 255, 255, 0.7) !important;
  }
`;
document.head.appendChild(customStyle);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({ message: '', type: 'info', isVisible: false });

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setShowDropdown(false); // Close dropdown when opening modal
  };

  const handleLogoutConfirm = async () => {
    try {
      setIsLoggingOut(true);
      setShowLogoutModal(false);
      
      // Call the logout function from auth context
      logout();
      
      // Clear any additional local storage items if needed
      localStorage.removeItem('lastLoginTime');
      localStorage.removeItem('userPreferences');
      
      // Show success message
      setToast({
        message: 'You have been logged out successfully',
        type: 'success',
        isVisible: true
      });
      
      // Navigate to login page with replace to prevent going back after delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error('Error during logout:', error);
      setToast({
        message: 'Error during logout, but you have been signed out',
        type: 'warning',
        isVisible: true
      });
      
      // Even if there's an error, still navigate to login after delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleToastClose = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  const colorTheme = {
    primary: '#273C63',     // Dark blue
    secondary: '#666983',   // Gray-blue
    accent: '#7EC8EC',      // Light blue
    tertiary: '#86717B',    // Muted purple
    light: '#EAF1ED',       // Light gray
    white: '#FFFFFF',
    danger: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    info: '#17A2B8'
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: colorTheme.light }}>
      {/* Sidebar */}
      <div className="text-white shadow-lg" style={{ 
        width: '240px', 
        minHeight: '100vh', 
        background: `linear-gradient(135deg, ${colorTheme.primary} 0%, ${colorTheme.secondary} 100%)` 
      }}>
        <div className="p-2">
          {/* Logo and Company */}
          <div className="d-flex align-items-center mb-4 pb-3 border-bottom border-light border-opacity-25">
            <div className="me-3" style={{ 
              width: '45px', 
              height: '45px', 
              backgroundColor: colorTheme.accent, 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <i className="fas fa-clock text-white" style={{ fontSize: '20px' }}></i>
            </div>
            <div>
              <h5 className="fw-bold mb-0">TimeSheet Pro</h5>
              <small className="text-light opacity-75">Evolute Global</small>
            </div>
          </div>
          
          {/* Search */}
          <div className="mb-4">
            <div className="input-group">
              <span className="input-group-text border-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                <i className="fas fa-search"></i>
              </span>
              <input 
                type="text" 
                className="form-control border-0 white-placeholder" 
                placeholder="Search employees or actions..." 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  color: 'white',
                  fontSize: '14px'
                }}
                onFocus={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                onBlur={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>
          
          {/* Navigation */}
          <ul className="nav nav-pills flex-column">
            <li className="nav-item mb-1">
              <a className="nav-link text-white d-flex align-items-center py-3 px-3 rounded" 
                 style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} href="#">
                <i className="fas fa-home me-3" style={{ width: '20px' }}></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="nav-item mb-1">
              <a className="nav-link text-white d-flex align-items-center py-3 px-3 rounded" 
                 style={{ transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                 href="#">
                <i className="fas fa-user me-3" style={{ width: '20px' }}></i>
                <span>My Profile</span>
              </a>
            </li>
            <li className="nav-item mb-1">
              <a className="nav-link text-white d-flex align-items-center py-3 px-3 rounded"
                 style={{ transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                 href="#">
                <i className="fas fa-clock me-3" style={{ width: '20px' }}></i>
                <span>Timesheet</span>
              </a>
            </li>
            <li className="nav-item mb-1">
              <a className="nav-link text-white d-flex align-items-center py-3 px-3 rounded"
                 style={{ transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                 href="#">
                <i className="fas fa-calendar-alt me-3" style={{ width: '20px' }}></i>
                <span>Leave Management</span>
              </a>
            </li>
            <li className="nav-item mb-1">
              <a className="nav-link text-white d-flex align-items-center py-3 px-3 rounded position-relative"
                 style={{ transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                 href="#">
                <i className="fas fa-inbox me-3" style={{ width: '20px' }}></i>
                <span>Inbox</span>
                <span className="badge ms-auto" style={{ backgroundColor: colorTheme.danger }}>6</span>
              </a>
            </li>
            <li className="nav-item mb-1">
              <a className="nav-link text-white d-flex align-items-center py-3 px-3 rounded"
                 style={{ transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                 href="#">
                <i className="fas fa-users me-3" style={{ width: '20px' }}></i>
                <span>My Team</span>
              </a>
            </li>
            <li className="nav-item mb-1">
              <a className="nav-link text-white d-flex align-items-center py-3 px-3 rounded"
                 style={{ transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                 href="#">
                <i className="fas fa-chart-bar me-3" style={{ width: '20px' }}></i>
                <span>Reports</span>
              </a>
            </li>
            <li className="nav-item mb-1">
              <a className="nav-link text-white d-flex align-items-center py-3 px-3 rounded"
                 style={{ transition: 'all 0.3s ease' }}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                 href="#">
                <i className="fas fa-cog me-3" style={{ width: '20px' }}></i>
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Header */}
        <nav className="navbar navbar-expand-lg shadow-sm" style={{ 
          backgroundColor: colorTheme.white, 
          borderBottom: `1px solid ${colorTheme.light}` 
        }}>
          <div className="container-fluid px-4">
            <div className="d-flex align-items-center">
              <h4 className="mb-0 fw-bold" style={{ color: colorTheme.primary }}>Dashboard</h4>
            </div>
            <div className="navbar-nav ms-auto d-flex align-items-center">
              <div className="nav-item me-3">
                <button className="btn btn-outline-primary btn-sm position-relative">
                  <i className="fas fa-bell"></i>
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                    3
                  </span>
                </button>
              </div>
              <div className="nav-item dropdown position-relative" ref={dropdownRef}>
                <button 
                  className="nav-link dropdown-toggle d-flex align-items-center border-0 bg-transparent" 
                  onClick={toggleDropdown}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="me-2 text-end">
                    <div className="fw-bold" style={{ color: colorTheme.primary, fontSize: '14px' }}>
                      {user ? `${user.firstName} ${user.lastName}` : 'User'}
                    </div>
                    <div className="text-muted" style={{ fontSize: '12px' }}>
                      {user?.role || 'Employee'}
                    </div>
                  </div>
                  <span className="badge rounded-circle d-flex align-items-center justify-content-center" style={{ 
                    width: '40px', 
                    height: '40px', 
                    backgroundColor: colorTheme.accent,
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : 'U'}
                  </span>
                </button>
                {showDropdown && (
                  <ul className="dropdown-menu dropdown-menu-end shadow show position-absolute" style={{ right: 0, top: '100%', zIndex: 1000 }}>
                  <li><a className="dropdown-item" href="#"><i className="fas fa-user me-2"></i>Profile</a></li>
                  <li><a className="dropdown-item" href="#"><i className="fas fa-cog me-2"></i>Settings</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button 
                      className="dropdown-item text-danger border-0 bg-transparent w-100 text-start" 
                      onClick={handleLogoutClick}
                      disabled={isLoggingOut}
                      style={{ cursor: isLoggingOut ? 'not-allowed' : 'pointer' }}
                    >
                      {isLoggingOut ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Logging out...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-out-alt me-2"></i>
                          Logout
                        </>
                      )}
                    </button>
                  </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </nav>
        
        {/* Dashboard Content */}
        <div className="container-fluid px-4 py-4">
          {/* Welcome Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="fw-bold mb-1" style={{ color: colorTheme.primary }}>Welcome back, vaibhav!</h2>
                  <p className="text-muted mb-0">Here's what's happening with your timesheet today.</p>
                </div>
                <div className="text-muted">
                  <i className="fas fa-calendar me-2"></i>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${colorTheme.primary} 0%, ${colorTheme.secondary} 100%)` }}>
                <div className="card-body text-white">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <i className="fas fa-clock fa-2x"></i>
                    </div>
                    <div>
                      <h3 className="mb-0">8.5</h3>
                      <small>Hours Today</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${colorTheme.accent} 0%, ${colorTheme.info} 100%)` }}>
                <div className="card-body text-white">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <i className="fas fa-calendar-week fa-2x"></i>
                    </div>
                    <div>
                      <h3 className="mb-0">42.5</h3>
                      <small>Hours This Week</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${colorTheme.success} 0%, #20C997 100%)` }}>
                <div className="card-body text-white">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <i className="fas fa-tasks fa-2x"></i>
                    </div>
                    <div>
                      <h3 className="mb-0">12</h3>
                      <small>Tasks Completed</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${colorTheme.warning} 0%, #F39C12 100%)` }}>
                <div className="card-body text-white">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <i className="fas fa-inbox fa-2x"></i>
                    </div>
                    <div>
                      <h3 className="mb-0">6</h3>
                      <small>Pending Approvals</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Dashboard Grid */}
          <div className="row">
            {/* Left Column */}
            <div className="col-md-8">
              {/* Time Tracking */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3">
                  <h5 className="mb-0 fw-bold" style={{ color: colorTheme.primary }}>
                    <i className="fas fa-stopwatch me-2" style={{ color: colorTheme.accent }}></i>
                    Time Tracking - Today
                  </h5>
                  <button className="btn btn-sm" style={{ backgroundColor: colorTheme.accent, color: 'white' }}>
                    <i className="fas fa-plus me-1"></i>New Entry
                  </button>
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-3">
                      <div className="border-end">
                        <h4 className="text-success mb-1">9:30</h4>
                        <small className="text-muted">Clock In</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="border-end">
                        <h4 className="text-danger mb-1">--:--</h4>
                        <small className="text-muted">Clock Out</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="border-end">
                        <h4 style={{ color: colorTheme.primary }} className="mb-1">8:30</h4>
                        <small className="text-muted">Total Hours</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <h4 className="text-warning mb-1">8:00</h4>
                      <small className="text-muted">Required</small>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Activities */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-bold" style={{ color: colorTheme.primary }}>
                    <i className="fas fa-history me-2" style={{ color: colorTheme.accent }}></i>
                    Recent Activities
                  </h5>
                </div>
                <div className="card-body">
                  <div className="timeline">
                    <div className="d-flex align-items-center mb-3">
                      <div className="me-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" 
                             style={{ width: '40px', height: '40px', backgroundColor: colorTheme.accent }}>
                          <i className="fas fa-clock text-white"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold">Clocked in</div>
                        <small className="text-muted">Today at 9:30 AM</small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <div className="me-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" 
                             style={{ width: '40px', height: '40px', backgroundColor: colorTheme.success }}>
                          <i className="fas fa-check text-white"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold">Task completed: Frontend Development</div>
                        <small className="text-muted">Yesterday at 5:45 PM</small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" 
                             style={{ width: '40px', height: '40px', backgroundColor: colorTheme.warning }}>
                          <i className="fas fa-calendar text-white"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold">Leave request submitted</div>
                        <small className="text-muted">2 days ago</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="col-md-4">
              {/* Holidays */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3">
                  <h5 className="mb-0 fw-bold" style={{ color: colorTheme.primary }}>
                    <i className="fas fa-calendar-alt me-2" style={{ color: colorTheme.accent }}></i>
                    Upcoming Holidays
                  </h5>
                  <a href="#" className="text-decoration-none" style={{ color: colorTheme.accent }}>View All</a>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center p-3 rounded" 
                       style={{ background: `linear-gradient(135deg, ${colorTheme.tertiary} 0%, ${colorTheme.secondary} 100%)` }}>
                    <div className="me-3">
                      <i className="fas fa-gift text-white" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <div className="text-white">
                      <h6 className="mb-0">Raksha Bandhan</h6>
                      <p className="mb-0">Sat, 09 August, 2025</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Team Status */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-bold" style={{ color: colorTheme.primary }}>
                    <i className="fas fa-users me-2" style={{ color: colorTheme.accent }}></i>
                    Team Status
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Present</span>
                      <span className="fw-bold" style={{ color: colorTheme.success }}>8/10</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar" style={{ backgroundColor: colorTheme.success, width: '80%' }}></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">On Leave</span>
                      <span className="fw-bold" style={{ color: colorTheme.warning }}>1/10</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar" style={{ backgroundColor: colorTheme.warning, width: '10%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Remote</span>
                      <span className="fw-bold" style={{ color: colorTheme.accent }}>1/10</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar" style={{ backgroundColor: colorTheme.accent, width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-bold" style={{ color: colorTheme.primary }}>
                    <i className="fas fa-bolt me-2" style={{ color: colorTheme.accent }}></i>
                    Quick Actions
                  </h5>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button className="btn btn-outline-primary d-flex align-items-center justify-content-start py-2">
                      <i className="fas fa-calendar-plus me-2"></i>
                      Apply for Leave
                    </button>
                    <button className="btn btn-outline-primary d-flex align-items-center justify-content-start py-2">
                      <i className="fas fa-file-alt me-2"></i>
                      Submit Timesheet
                    </button>
                    <button className="btn btn-outline-primary d-flex align-items-center justify-content-start py-2">
                      <i className="fas fa-chart-line me-2"></i>
                      View Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: colorTheme.primary }}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Confirm Logout
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleLogoutCancel}
                  disabled={isLoggingOut}
                ></button>
              </div>
              <div className="modal-body pt-2">
                <p className="mb-0 text-muted">
                  Are you sure you want to log out? You will need to sign in again to access your account.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleLogoutCancel}
                  disabled={isLoggingOut}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleLogoutConfirm}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Logging out...
                    </>
                  ) : (
                    'Logout'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={handleToastClose}
      />
    </div>
  );
};

export default Dashboard;
