const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'timesheet_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// ====================
// DASHBOARD STATS
// ====================
const getDashboardStats = async (req, res) => {
  try {
    // Get counts using raw SQL queries
    const [totalUsersResult] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [totalRolesResult] = await sequelize.query('SELECT COUNT(*) as count FROM role_masters');
    const [totalClientsResult] = await sequelize.query('SELECT COUNT(*) as count FROM clients');
    const [totalProjectsResult] = await sequelize.query('SELECT COUNT(*) as count FROM projects');
    const [activeUsersResult] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');

    const totalUsers = parseInt(totalUsersResult[0].count);
    const activeUsers = parseInt(activeUsersResult[0].count);

    const stats = {
      totalUsers,
      totalRoles: parseInt(totalRolesResult[0].count),
      totalClients: parseInt(totalClientsResult[0].count),
      totalProjects: parseInt(totalProjectsResult[0].count),
      activeUsers,
      inactiveUsers: totalUsers - activeUsers
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

// ====================
// ROLE MANAGEMENT
// ====================
const getRoles = async (req, res) => {
  try {
    const [roles] = await sequelize.query(`
      SELECT 
        rm.id,
        rm.role_code,
        rm.role_name as name,
        rm.description,
        rm.level,
        rm.can_manage_users,
        rm.can_manage_projects,
        rm.can_view_reports,
        rm.is_active,
        rm.created_at,
        rm.updated_at
      FROM role_masters rm
      ORDER BY rm.level ASC
    `);

    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Error fetching roles', error: error.message });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, description, level, canManageUsers, canManageProjects, canViewReports } = req.body;
    
    // Generate role code from name
    const roleCode = name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);
    
    const [result] = await sequelize.query(`
      INSERT INTO role_masters (role_code, role_name, description, level, can_manage_users, can_manage_projects, can_view_reports, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, {
      bind: [roleCode, name, description, level, canManageUsers || false, canManageProjects || false, canViewReports || false]
    });

    res.status(201).json({ message: 'Role created successfully', role: result[0] });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Error creating role', error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, level, canManageUsers, canManageProjects, canViewReports } = req.body;

    const [result] = await sequelize.query(`
      UPDATE role_masters 
      SET role_name = $1, description = $2, level = $3, can_manage_users = $4, 
          can_manage_projects = $5, can_view_reports = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, {
      bind: [name, description, level, canManageUsers || false, canManageProjects || false, canViewReports || false, id]
    });

    if (result.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if role is being used by any users
    const [usersWithRole] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE role_id = $1', {
      bind: [id]
    });

    if (parseInt(usersWithRole[0].count) > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. ${usersWithRole[0].count} users are assigned to this role.` 
      });
    }

    await sequelize.query('DELETE FROM role_masters WHERE id = $1', {
      bind: [id]
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Error deleting role', error: error.message });
  }
};

// ====================
// USER MANAGEMENT
// ====================
const getUsers = async (req, res) => {
  try {
    const [users] = await sequelize.query(`
      SELECT 
        u.id,
        u.employee_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role as legacy_role,
        u.department,
        u.designation,
        u.date_of_joining,
        u.is_active,
        u.created_at,
        u.updated_at,
        u.role_id,
        rm.role_name as role_name,
        rm.level as role_level
      FROM users u
      LEFT JOIN role_masters rm ON u.role_id = rm.id
      ORDER BY u.created_at DESC
    `);

    // Transform the data to match expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.employee_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      department: user.department,
      designation: user.designation,
      dateOfJoining: user.date_of_joining,
      isActive: user.is_active,
      role: {
        id: user.role_id,
        name: user.role_name || user.legacy_role,
        level: user.role_level || 1
      },
      createdAt: user.created_at
    }));

    res.json(transformedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { employeeId, email, password, firstName, lastName, phone, department, designation, roleId } = req.body;

    // Check if user already exists
    const [existingUser] = await sequelize.query(`
      SELECT id FROM users WHERE email = $1 OR employee_id = $2 LIMIT 1
    `, {
      bind: [email, employeeId]
    });

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email or employee ID' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await sequelize.query(`
      INSERT INTO users (employee_id, email, password_hash, first_name, last_name, phone, department, designation, role_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, {
      bind: [employeeId, email, hashedPassword, firstName, lastName, phone, department, designation, roleId]
    });

    res.status(201).json({ message: 'User created successfully', user: result[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, email, firstName, lastName, phone, department, designation, roleId, isActive } = req.body;

    const [result] = await sequelize.query(`
      UPDATE users 
      SET employee_id = $1, email = $2, first_name = $3, last_name = $4, phone = $5, 
          department = $6, designation = $7, role_id = $8, is_active = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `, {
      bind: [employeeId, email, firstName, lastName, phone, department, designation, roleId, isActive, id]
    });

    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    await sequelize.query('DELETE FROM users WHERE id = $1', {
      bind: [id]
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// ====================
// CLIENT MANAGEMENT
// ====================
const getClients = async (req, res) => {
  try {
    const [clients] = await sequelize.query(`
      SELECT 
        c.*,
        COUNT(p.id) as project_count
      FROM clients c
      LEFT JOIN projects p ON c.id = p.client_id
      GROUP BY c.id
      ORDER BY c.client_name ASC
    `);

    // Transform data to match expected format
    const transformedClients = clients.map(client => ({
      id: client.id,
      name: client.client_name,
      description: client.company_name,
      contactEmail: client.email,
      contactPhone: client.phone,
      address: client.address,
      isActive: client.is_active,
      projects: Array.from({ length: parseInt(client.project_count) }, (_, i) => ({ id: i, name: `Project ${i + 1}` })),
      createdAt: client.created_at
    }));

    res.json(transformedClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, description, contactEmail, contactPhone, address, isActive } = req.body;
    
    // Generate client code
    const clientCode = name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);
    
    const [result] = await sequelize.query(`
      INSERT INTO clients (client_code, client_name, company_name, email, phone, address, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, {
      bind: [clientCode, name, description, contactEmail, contactPhone, address, isActive !== false]
    });

    res.status(201).json({ message: 'Client created successfully', client: result[0] });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: 'Error creating client', error: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, contactEmail, contactPhone, address, isActive } = req.body;

    const [result] = await sequelize.query(`
      UPDATE clients 
      SET client_name = $1, company_name = $2, email = $3, phone = $4, address = $5, 
          is_active = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, {
      bind: [name, description, contactEmail, contactPhone, address, isActive, id]
    });

    if (result.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Error updating client', error: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if client has projects
    const [projects] = await sequelize.query('SELECT COUNT(*) as count FROM projects WHERE client_id = $1', {
      bind: [id]
    });

    if (parseInt(projects[0].count) > 0) {
      return res.status(400).json({ 
        message: `Cannot delete client. ${projects[0].count} projects are associated with this client.` 
      });
    }

    await sequelize.query('DELETE FROM clients WHERE id = $1', {
      bind: [id]
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
};

// ====================
// PROJECT MANAGEMENT
// ====================
const getProjects = async (req, res) => {
  try {
    const [projects] = await sequelize.query(`
      SELECT 
        p.*,
        c.client_name,
        u.first_name as manager_first_name,
        u.last_name as manager_last_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      ORDER BY p.project_name ASC
    `);

    // Transform data to match expected format
    const transformedProjects = projects.map(project => ({
      id: project.id,
      name: project.project_name,
      description: project.description,
      startDate: project.start_date,
      endDate: project.end_date,
      isActive: project.is_active,
      client: {
        id: project.client_id,
        name: project.client_name
      },
      manager: {
        id: project.project_manager_id,
        firstName: project.manager_first_name,
        lastName: project.manager_last_name
      },
      createdAt: project.created_at
    }));

    res.json(transformedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description, clientId, managerId, startDate, endDate, isActive } = req.body;
    
    // Generate project code
    const projectCode = name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);
    
    const [result] = await sequelize.query(`
      INSERT INTO projects (project_code, project_name, description, client_id, project_manager_id, start_date, end_date, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, {
      bind: [projectCode, name, description, clientId, managerId, startDate, endDate, isActive !== false]
    });

    res.status(201).json({ message: 'Project created successfully', project: result[0] });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, clientId, managerId, startDate, endDate, isActive } = req.body;

    const [result] = await sequelize.query(`
      UPDATE projects 
      SET project_name = $1, description = $2, client_id = $3, project_manager_id = $4, 
          start_date = $5, end_date = $6, is_active = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, {
      bind: [name, description, clientId, managerId, startDate, endDate, isActive, id]
    });

    if (result.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    await sequelize.query('DELETE FROM projects WHERE id = $1', {
      bind: [id]
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

// ====================
// PERMISSION AND MODULE MANAGEMENT (PLACEHOLDER)
// ====================
const getPermissions = async (req, res) => {
  try {
    const [permissions] = await sequelize.query(`
      SELECT * FROM permission_masters ORDER BY permission_name ASC
    `);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Error fetching permissions', error: error.message });
  }
};

const getModules = async (req, res) => {
  try {
    const [modules] = await sequelize.query(`
      SELECT * FROM module_masters ORDER BY module_name ASC
    `);
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Error fetching modules', error: error.message });
  }
};

module.exports = {
  // Dashboard
  getDashboardStats,
  
  // Role management
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  
  // User management
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  
  // Permission and module management
  getPermissions,
  getModules,
  
  // Client management
  getClients,
  createClient,
  updateClient,
  deleteClient,
  
  // Project management
  getProjects,
  createProject,
  updateProject,
  deleteProject
};
