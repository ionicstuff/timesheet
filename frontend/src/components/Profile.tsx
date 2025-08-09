import React, { useState, useEffect } from 'react';
import UserService, { UserProfileData } from '../services/user.service';
import Toast from './Toast';

const Profile: React.FC = () => {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({ message: '', type: 'info', isVisible: false });

  // Form state for editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    designation: ''
  });

  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    border: `1px solid var(--border-color)`,
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    padding: '24px',
    marginBottom: '24px'
  };

  const colorTheme = {
    primary: '#273C63',
    secondary: '#666983',
    accent: '#7EC8EC',
    tertiary: '#86717B',
    light: '#EAF1ED',
    white: '#FFFFFF',
    danger: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    info: '#17A2B8'
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await UserService.getUserProfile();
      setProfileData(data);
      
      // Initialize form data
      setFormData({
        firstName: data.basicInfo.firstName,
        lastName: data.basicInfo.lastName,
        phone: data.basicInfo.phone || '',
        department: data.professionalInfo.department,
        designation: data.professionalInfo.designation
      });

    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to load profile data',
        type: 'error',
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await UserService.updateProfile(formData);
      
      // Refresh profile data
      await fetchProfile();
      setEditMode(false);
      
      setToast({
        message: 'Profile updated successfully!',
        type: 'success',
        isVisible: true
      });
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to update profile',
        type: 'error',
        isVisible: true
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        firstName: profileData.basicInfo.firstName,
        lastName: profileData.basicInfo.lastName,
        phone: profileData.basicInfo.phone || '',
        department: profileData.professionalInfo.department,
        designation: profileData.professionalInfo.designation
      });
    }
    setEditMode(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToastClose = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  if (loading) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: colorTheme.accent }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Failed to load profile data. Please try refreshing the page.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="row justify-content-center">
        <div className="col-md-10">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="h2 mb-1" style={{ color: 'var(--text-primary)' }}>
                My Profile
              </h2>
              <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>
                View and manage your personal information
              </p>
            </div>
            <div>
              {!editMode ? (
                <button
                  className="btn d-flex align-items-center"
                  style={{
                    backgroundColor: colorTheme.accent,
                    color: 'white',
                    border: 'none'
                  }}
                  onClick={() => setEditMode(true)}
                >
                  <i className="fas fa-edit me-2"></i>
                  Edit Profile
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn d-flex align-items-center"
                    style={{
                      backgroundColor: colorTheme.success,
                      color: 'white',
                      border: 'none'
                    }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="row">
            {/* Left Column */}
            <div className="col-md-4">
              {/* Profile Card */}
              <div className="card border-0" style={cardStyle}>
                <div className="text-center">
                  {/* Profile Picture */}
                  <div className="mb-3">
                    {profileData.basicInfo.profilePicture ? (
                      <img
                        src={UserService.getProfileImageUrl(profileData.basicInfo.profilePicture)}
                        alt="Profile"
                        className="rounded-circle"
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle mx-auto d-flex align-items-center justify-content-center"
                        style={{
                          width: '120px',
                          height: '120px',
                          backgroundColor: colorTheme.accent,
                          color: 'white',
                          fontSize: '2.5rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {UserService.getInitials(profileData.basicInfo.firstName, profileData.basicInfo.lastName)}
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <h4 className="mb-1" style={{ color: 'var(--text-primary)' }}>
                    {profileData.basicInfo.fullName}
                  </h4>
                  <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {profileData.professionalInfo.designation}
                  </p>
                  <div className="mb-3">
                    <span
                      className="badge rounded-pill px-3 py-2"
                      style={{
                        backgroundColor: UserService.getRoleColor(profileData.professionalInfo.role),
                        color: 'white'
                      }}
                    >
                      {profileData.professionalInfo.roleDetails.roleName}
                    </span>
                  </div>
                  
                  {/* Status */}
                  <div className="mb-3">
                    <span
                      className={`badge rounded-pill px-3 py-2 ${profileData.professionalInfo.isActive ? 'bg-success' : 'bg-danger'}`}
                    >
                      {UserService.getStatusText(profileData.professionalInfo.isActive)}
                    </span>
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--border-color)' }} />

                {/* Contact Info */}
                <div>
                  <h6 className="mb-3" style={{ color: 'var(--text-primary)' }}>
                    <i className="fas fa-address-book me-2" style={{ color: colorTheme.accent }}></i>
                    Contact Information
                  </h6>
                  <div className="mb-2">
                    <small className="text-muted">Email</small>
                    <p className="mb-1" style={{ color: 'var(--text-primary)' }}>
                      <i className="fas fa-envelope me-2 text-muted"></i>
                      {profileData.basicInfo.email}
                    </p>
                  </div>
                  {profileData.basicInfo.phone && (
                    <div className="mb-2">
                      <small className="text-muted">Phone</small>
                      <p className="mb-1" style={{ color: 'var(--text-primary)' }}>
                        <i className="fas fa-phone me-2 text-muted"></i>
                        {profileData.basicInfo.phone}
                      </p>
                    </div>
                  )}
                  <div className="mb-2">
                    <small className="text-muted">Employee ID</small>
                    <p className="mb-0" style={{ color: 'var(--text-primary)' }}>
                      <i className="fas fa-id-badge me-2 text-muted"></i>
                      {profileData.basicInfo.employeeId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Card */}
              <div className="card border-0" style={cardStyle}>
                <h6 className="mb-3" style={{ color: 'var(--text-primary)' }}>
                  <i className="fas fa-chart-bar me-2" style={{ color: colorTheme.accent }}></i>
                  Quick Stats
                </h6>
                <div className="row text-center">
                  <div className="col-4">
                    <h5 className="mb-0" style={{ color: colorTheme.accent }}>
                      {profileData.statistics.yearsOfService}
                    </h5>
                    <small className="text-muted">Years</small>
                  </div>
                  <div className="col-4">
                    <h5 className="mb-0" style={{ color: colorTheme.success }}>
                      {profileData.statistics.directReports}
                    </h5>
                    <small className="text-muted">Reports</small>
                  </div>
                  <div className="col-4">
                    <h5 className="mb-0" style={{ color: colorTheme.warning }}>
                      {profileData.statistics.managedProjectsCount}
                    </h5>
                    <small className="text-muted">Projects</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-md-8">
              {/* Professional Information */}
              <div className="card border-0 mb-4" style={cardStyle}>
                <h5 className="mb-3" style={{ color: 'var(--text-primary)' }}>
                  <i className="fas fa-briefcase me-2" style={{ color: colorTheme.accent }}></i>
                  Professional Information
                </h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-muted">First Name</label>
                      {editMode ? (
                        <input
                          type="text"
                          className="form-control"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          style={{
                            backgroundColor: 'var(--secondary-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      ) : (
                        <p className="mb-0" style={{ color: 'var(--text-primary)' }}>
                          {profileData.basicInfo.firstName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-muted">Last Name</label>
                      {editMode ? (
                        <input
                          type="text"
                          className="form-control"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          style={{
                            backgroundColor: 'var(--secondary-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      ) : (
                        <p className="mb-0" style={{ color: 'var(--text-primary)' }}>
                          {profileData.basicInfo.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-muted">Phone</label>
                      {editMode ? (
                        <input
                          type="text"
                          className="form-control"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          style={{
                            backgroundColor: 'var(--secondary-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      ) : (
                        <p className="mb-0" style={{ color: 'var(--text-primary)' }}>
                          {profileData.basicInfo.phone || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-muted">Department</label>
                      {editMode ? (
                        <input
                          type="text"
                          className="form-control"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          style={{
                            backgroundColor: 'var(--secondary-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      ) : (
                        <p className="mb-0" style={{ color: 'var(--text-primary)' }}>
                          {profileData.professionalInfo.department}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-muted">Designation</label>
                      {editMode ? (
                        <input
                          type="text"
                          className="form-control"
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                          style={{
                            backgroundColor: 'var(--secondary-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      ) : (
                        <p className="mb-0" style={{ color: 'var(--text-primary)' }}>
                          {profileData.professionalInfo.designation}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-muted">Date of Joining</label>
                      <p className="mb-0" style={{ color: 'var(--text-primary)' }}>
                        {UserService.formatDate(profileData.professionalInfo.dateOfJoining)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hierarchy Information */}
              {(profileData.hierarchyInfo.manager || profileData.hierarchyInfo.directReports.length > 0) && (
                <div className="card border-0 mb-4" style={cardStyle}>
                  <h5 className="mb-3" style={{ color: 'var(--text-primary)' }}>
                    <i className="fas fa-sitemap me-2" style={{ color: colorTheme.accent }}></i>
                    Hierarchy
                  </h5>
                  
                  {profileData.hierarchyInfo.manager && (
                    <div className="mb-3">
                      <h6 className="text-muted">Reports To</h6>
                      <div className="d-flex align-items-center p-3 rounded" style={{ backgroundColor: 'var(--secondary-bg)' }}>
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: colorTheme.accent,
                            color: 'white',
                            fontSize: '0.9rem'
                          }}
                        >
                          {UserService.getInitials(
                            profileData.hierarchyInfo.manager.managerDetails.firstName,
                            profileData.hierarchyInfo.manager.managerDetails.lastName
                          )}
                        </div>
                        <div>
                          <p className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                            {profileData.hierarchyInfo.manager.managerDetails.firstName} {profileData.hierarchyInfo.manager.managerDetails.lastName}
                          </p>
                          <small className="text-muted">
                            {profileData.hierarchyInfo.manager.managerDetails.designation} • {profileData.hierarchyInfo.manager.managerDetails.department}
                          </small>
                        </div>
                      </div>
                    </div>
                  )}

                  {profileData.hierarchyInfo.directReports.length > 0 && (
                    <div>
                      <h6 className="text-muted">Direct Reports ({profileData.hierarchyInfo.directReports.length})</h6>
                      <div className="row">
                        {profileData.hierarchyInfo.directReports.map((report, index) => (
                          <div key={index} className="col-md-6 mb-2">
                            <div className="d-flex align-items-center p-2 rounded" style={{ backgroundColor: 'var(--secondary-bg)' }}>
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  backgroundColor: colorTheme.success,
                                  color: 'white',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {report.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
                              </div>
                              <div className="flex-grow-1">
                                <p className="mb-0" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                  {report.name}
                                </p>
                                <small className="text-muted">{report.designation}</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Management Information */}
              {(profileData.managementInfo.managedClients.length > 0 || profileData.managementInfo.managedProjects.length > 0) && (
                <div className="card border-0" style={cardStyle}>
                  <h5 className="mb-3" style={{ color: 'var(--text-primary)' }}>
                    <i className="fas fa-tasks me-2" style={{ color: colorTheme.accent }}></i>
                    Management Responsibilities
                  </h5>
                  
                  <div className="row">
                    {profileData.managementInfo.managedClients.length > 0 && (
                      <div className="col-md-6 mb-3">
                        <h6 className="text-muted">
                          Managed Clients ({profileData.managementInfo.managedClients.length})
                        </h6>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {profileData.managementInfo.managedClients.map((client) => (
                            <div
                              key={client.id}
                              className="d-flex align-items-center p-2 mb-1 rounded"
                              style={{ backgroundColor: 'var(--secondary-bg)' }}
                            >
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: colorTheme.warning,
                                  color: 'white',
                                  fontSize: '0.7rem'
                                }}
                              >
                                <i className="fas fa-building"></i>
                              </div>
                              <div>
                                <p className="mb-0" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                  {client.clientName}
                                </p>
                                <small className="text-muted">{client.industry}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {profileData.managementInfo.managedProjects.length > 0 && (
                      <div className="col-md-6 mb-3">
                        <h6 className="text-muted">
                          Managed Projects ({profileData.managementInfo.managedProjects.length})
                        </h6>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {profileData.managementInfo.managedProjects.map((project) => (
                            <div
                              key={project.id}
                              className="d-flex align-items-center p-2 mb-1 rounded"
                              style={{ backgroundColor: 'var(--secondary-bg)' }}
                            >
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: colorTheme.info,
                                  color: 'white',
                                  fontSize: '0.7rem'
                                }}
                              >
                                <i className="fas fa-project-diagram"></i>
                              </div>
                              <div>
                                <p className="mb-0" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                  {project.projectName}
                                </p>
                                <small className="text-muted">{project.status}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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

export default Profile;
