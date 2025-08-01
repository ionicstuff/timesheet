import React, { useState, useEffect } from 'react';
import { getUsers, getUser, createUser, updateUser, deleteUser, getRoles, getDepartments, getDesignations } from '../services/admin-api.service';
import '../styles/AdminManagement.css';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    level: number;
  };
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  level: number;
}

interface Department {
  name: string;
}

interface Designation {
  name: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    designation: '',
    roleId: '',
    managerId: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDepartments();
    fetchDesignations();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      const data = await getDepartments();
      console.log('Departments received:', data);
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Fallback data if API fails
      const fallbackDepartments = [
        { name: 'Engineering' },
        { name: 'Sales' },
        { name: 'Marketing' },
        { name: 'Human Resources' },
        { name: 'Finance' },
        { name: 'Operations' },
        { name: 'Customer Support' },
        { name: 'Product Management' },
        { name: 'Quality Assurance' },
        { name: 'IT Support' }
      ];
      setDepartments(fallbackDepartments);
    }
  };

  const fetchDesignations = async () => {
    try {
      console.log('Fetching designations...');
      const data = await getDesignations();
      console.log('Designations received:', data);
      setDesignations(data);
    } catch (error) {
      console.error('Error fetching designations:', error);
      // Fallback data if API fails
      const fallbackDesignations = [
        { name: 'Software Engineer' },
        { name: 'Senior Software Engineer' },
        { name: 'Lead Software Engineer' },
        { name: 'Principal Software Engineer' },
        { name: 'Frontend Developer' },
        { name: 'Backend Developer' },
        { name: 'Full Stack Developer' },
        { name: 'DevOps Engineer' },
        { name: 'QA Engineer' },
        { name: 'Product Manager' },
        { name: 'Project Manager' },
        { name: 'Business Analyst' },
        { name: 'UI/UX Designer' },
        { name: 'Data Analyst' },
        { name: 'Sales Executive' },
        { name: 'Marketing Specialist' },
        { name: 'HR Specialist' },
        { name: 'Finance Analyst' },
        { name: 'Operations Manager' },
        { name: 'Team Lead' },
        { name: 'Technical Lead' },
        { name: 'Architect' },
        { name: 'Consultant' },
        { name: 'Intern' },
        { name: 'Associate' },
        { name: 'Senior Associate' },
        { name: 'Manager' },
        { name: 'Senior Manager' },
        { name: 'Director' },
        { name: 'Vice President' }
      ];
      setDesignations(fallbackDesignations);
    }
  };

  const generateNewEmployeeId = () => {
    if (users.length === 0) {
      return 'E-001';
    }
    
    // Extract numeric part from all employee IDs and find the maximum
    const existingIds = users
      .map(user => user.username)
      .filter(username => username && username.startsWith('E-'))
      .map(username => {
        const numPart = username.split('-')[1];
        return isNaN(parseInt(numPart)) ? 0 : parseInt(numPart);
      });
    
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newIdNumber = maxId + 1;
    return `E-${newIdNumber.toString().padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data with proper types
      const submissionData = {
        ...formData,
        roleId: parseInt(formData.roleId),
        managerId: formData.managerId ? parseInt(formData.managerId) : null
      };
      
      console.log('Submitting user data:', submissionData);
      
      if (editingUser) {
        await updateUser(editingUser.id, submissionData);
      } else {
        await createUser(submissionData);
      }
      fetchUsers();
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = async (user: User) => {
    console.log('Edit button clicked for user:', user);
    try {
      console.log('Fetching detailed user data for ID:', user.id);
      const userData = await getUser(user.id);
      console.log('Received user data:', userData);
      
      setEditingUser(userData);
      setFormData({
        employeeId: userData.username,
        email: userData.email,
        password: '',
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || '',
        department: userData.department || '',
        designation: userData.designation || '',
        roleId: userData.role.id,
        managerId: userData.manager?.id || '',
        isActive: userData.isActive
      });
      setShowModal(true);
      console.log('Modal should be showing now');
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback: use the existing user data from the list
      console.log('Using fallback data from user list');
      setEditingUser(user);
      setFormData({
        employeeId: user.username,
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        phone: '',
        department: '',
        designation: '',
        roleId: user.role.id,
        managerId: user.manager?.id || '',
        isActive: user.isActive
      });
      setShowModal(true);
      console.log('Modal should be showing now with fallback data');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      department: '',
      designation: '',
      roleId: '',
      managerId: '',
      isActive: true
    });
    setEditingUser(null);
    setShowModal(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const getPotentialManagers = () => {
    if (!editingUser) return users;
    return users.filter(user => user.id !== editingUser.id);
  };

  if (isLoading) {
    return <div className="loading">Loading users...</div>;
  }

  console.log('UserManagement render - showModal:', showModal, 'editingUser:', editingUser);

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>User Management</h2>
        <button className="btn btn-primary" onClick={() => {
          console.log('Add New User button clicked');
          setEditingUser(null);
          setFormData({
            employeeId: generateNewEmployeeId(),
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            phone: '',
            department: '',
            designation: '',
            roleId: '',
            managerId: '',
            isActive: true
          });
          setShowModal(true);
          console.log('showModal set to true');
        }}>
          Add New User
        </button>
      </div>

      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th>Manager</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>
                  <span className={`role-badge level-${user.role.level}`}>
                    {user.role.name}
                  </span>
                </td>
                <td>
                  {user.manager ? `${user.manager.firstName} ${user.manager.lastName}` : 'None'}
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={() => handleEdit(user)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.name} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Designation</option>
                    {designations.map(designation => (
                      <option key={designation.name} value={designation.name}>
                        {designation.name}
                      </option>
                    ))}
                  </select>
                </div>
                {!editingUser && (
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Manager</label>
                  <select
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                  >
                    <option value="">No Manager</option>
                    {getPotentialManagers().map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update' : 'Create'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
