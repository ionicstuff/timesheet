import React, { useState, useEffect } from 'react';
import { getRoles, createRole, updateRole, deleteRole, getPermissions, getModules } from '../services/admin-api.service';
import '../styles/AdminManagement.css';

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions?: Permission[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  moduleId: string;
  module: {
    id: string;
    name: string;
  };
}

interface Module {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 1,
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesData, permissionsData, modulesData] = await Promise.all([
        getRoles(),
        getPermissions(),
        getModules()
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setModules(modulesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
      } else {
        await createRole(formData);
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      level: role.level,
      permissions: role.permissions?.map(p => p.id) || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await deleteRole(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      level: 1,
      permissions: []
    });
    setEditingRole(null);
    setShowModal(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  if (isLoading) {
    return <div className="loading">Loading roles...</div>;
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Role Management</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add New Role
        </button>
      </div>

      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Level</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td>
                  <span className={`role-badge level-${role.level}`}>
                    {role.name}
                  </span>
                </td>
                <td>{role.description}</td>
                <td>{role.level}</td>
                <td>
                  <div className="permissions-list">
                    {role.permissions?.slice(0, 3).map(permission => (
                      <span key={permission.id} className="permission-tag">
                        {permission.name}
                      </span>
                    ))}
                    {role.permissions && role.permissions.length > 3 && (
                      <span className="permission-tag more">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={() => handleEdit(role)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => handleDelete(role.id)}
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
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>{editingRole ? 'Edit Role' : 'Add New Role'}</h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Role Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Level</label>
                  <input
                    type="number"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Permissions</label>
                  <div className="permissions-grid">
                    {modules.map(module => (
                      <div key={module.id} className="module-permissions">
                        <h4>{module.name}</h4>
                        {module.permissions.map(permission => (
                          <label key={permission.id} className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            />
                            {permission.name}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRole ? 'Update' : 'Create'} Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
