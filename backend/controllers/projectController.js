const sequelize = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/projects');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only specific file types
    const allowedTypes = /pdf|doc|docx|zip|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, ZIP, and image files are allowed'));
    }
  }
});

// Get all projects
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

// Get a single project
const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [projects] = await sequelize.query(`
      SELECT 
        p.id,
        p.project_name,
        p.description,
        p.start_date,
        p.end_date,
        p.is_active,
        p.client_id,
        p.project_manager_id,
        p.created_at,
        p.notes,
        p.objectives,
        p.deliverables,
        p.priority,
        p.status,
        p.client_links,
        c.client_name,
        u.first_name as manager_first_name,
        u.last_name as manager_last_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      WHERE p.id = $1
    `, {
      bind: [id]
    });

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projects[0];
    const transformedProject = {
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
      createdAt: project.created_at,
      // Project details fields
      teamNotes: project.notes,
      objectives: project.objectives,
      deliverables: project.deliverables,
      priority: project.priority,
      status: project.status,
      clientLinks: project.client_links
    };

    res.json(transformedProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};
// Create a new project
const createProject = async (req, res) => {
  try {
    const { name, description, clientId, spocId, managerId, startDate, endDate, briefReceivedOn, estimatedTime, isActive } = req.body;
    
    // Validate required fields
    if (!name || !clientId || !spocId) {
      return res.status(400).json({ message: 'Project name, client, and SPOC are required' });
    }
    
    // Get current user info to check if they have Account Manager role
    const [currentUser] = await sequelize.query(`
      SELECT u.id, u.role_id, rm.role_code, rm.role_name 
      FROM users u
      LEFT JOIN role_masters rm ON u.role_id = rm.id
      WHERE u.id = $1
    `, {
      bind: [req.user.id]
    });
    
    // Auto-assign manager if creator is an Account Manager and no manager is explicitly provided
    let finalManagerId = managerId;
    if (!managerId && currentUser[0] && currentUser[0].role_code === 'ACM') {
      finalManagerId = req.user.id;
    }
    
    // Generate project code
    const projectCode = name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);
    
    const [result] = await sequelize.query(`
      INSERT INTO projects (project_code, project_name, description, client_id, spoc_id, project_manager_id, start_date, end_date, brief_received_on, estimated_time, is_active, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `, {
      bind: [
        projectCode, 
        name, 
        description || null, 
        clientId, 
        spocId, 
        finalManagerId || null, 
        startDate || null, 
        endDate || null, 
        briefReceivedOn || null, 
        estimatedTime || null, 
        isActive !== false, 
        req.user.id
      ]
    });

    res.status(201).json({ message: 'Project created successfully', project: result[0] });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// Update a project
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

// Delete a project
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

// Update project details (specifications, team notes, manager, etc.)
const updateProjectDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamNotes, objectives, deliverables, priority, status, clientLinks, managerId } = req.body;

    // Check if user has permission to update project details (managers and admins only)
    console.log('Debug: req.user.id =', req.user.id);
    const [currentUser] = await sequelize.query(`
      SELECT u.id, u.role_id, rm.role_code, rm.role_name 
      FROM users u
      LEFT JOIN role_masters rm ON u.role_id = rm.id
      WHERE u.id = $1
    `, {
      bind: [req.user.id]
    });

    console.log('Debug: currentUser =', currentUser);
    console.log('Debug: currentUser[0].role_code =', currentUser[0]?.role_code);
    console.log('Debug: role check result =', ['ACM', 'PM', 'ADM', 'ADMIN', 'DIR'].includes(currentUser[0]?.role_code));

    if (!currentUser[0] || !['ACM', 'PM', 'ADM', 'ADMIN', 'DIR'].includes(currentUser[0].role_code)) {
      console.log('Debug: Permission denied for user:', currentUser[0]);
      return res.status(403).json({ message: 'Only Account Managers, Project Managers, and Admins can update project details' });
    }

    console.log('Debug: Permission granted for user:', currentUser[0]);

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const bindValues = [];
    let bindIndex = 1;

    if (teamNotes !== undefined) {
      updateFields.push(`notes = $${bindIndex}`);
      bindValues.push(teamNotes);
      bindIndex++;
    }

    if (objectives !== undefined) {
      updateFields.push(`objectives = $${bindIndex}`);
      bindValues.push(objectives);
      bindIndex++;
    }

    if (deliverables !== undefined) {
      updateFields.push(`deliverables = $${bindIndex}`);
      bindValues.push(deliverables);
      bindIndex++;
    }

    if (clientLinks !== undefined) {
      updateFields.push(`client_links = $${bindIndex}`);
      bindValues.push(clientLinks);
      bindIndex++;
    }

    if (priority !== undefined) {
      updateFields.push(`priority = $${bindIndex}`);
      bindValues.push(priority);
      bindIndex++;
    }

    if (status !== undefined) {
      updateFields.push(`status = $${bindIndex}`);
      bindValues.push(status);
      bindIndex++;
    }

    if (managerId !== undefined) {
      updateFields.push(`project_manager_id = $${bindIndex}`);
      bindValues.push(managerId);
      bindIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }

    // Add updated_at and project id
    updateFields.push(`updated_at = NOW()`);
    bindValues.push(id);

    const query = `
      UPDATE projects 
      SET ${updateFields.join(', ')}
      WHERE id = $${bindIndex}
      RETURNING *
    `;

    const [result] = await sequelize.query(query, {
      bind: bindValues
    });

    if (result.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project details updated successfully' });
  } catch (error) {
    console.error('Error updating project details:', error);
    res.status(500).json({ message: 'Error updating project details', error: error.message });
  }
};

// Get all managers for dropdown
const getManagers = async (req, res) => {
  try {
    const [managers] = await sequelize.query(`
      SELECT u.id, u.first_name, u.last_name, u.email 
      FROM users u
      LEFT JOIN role_masters rm ON u.role_id = rm.id
      WHERE rm.role_code IN ('ACM', 'PM') AND u.is_active = true
      ORDER BY u.first_name, u.last_name
    `);

    res.json(managers);
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ message: 'Error fetching managers', error: error.message });
  }
};

// Get all users for team member assignment
const getUsers = async (req, res) => {
  try {
    const [users] = await sequelize.query(`
      SELECT 
        u.id, 
        u.first_name as firstName, 
        u.last_name as lastName, 
        u.email, 
        u.department, 
        u.designation,
        rm.role_name as role
      FROM users u
      LEFT JOIN role_masters rm ON u.role_id = rm.id
      WHERE u.is_active = true 
      AND rm.role_code NOT IN ('ADM', 'ADMIN', 'DIR') -- Exclude admin roles
      ORDER BY u.first_name, u.last_name
    `);

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Upload project files
const uploadProjectFiles = async (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      console.error('Error during file upload:', err);
      return res.status(400).json({ message: err.message });
    }

    const { id: projectId } = req.params;

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    try {
      const uploadedFiles = await Promise.all(files.map(async (file) => {
        const filePath = path.join('uploads/projects', file.filename);
        const [insertedFile] = await sequelize.query(`
          INSERT INTO project_attachments (project_id, filename, original_name, file_type, file_size, file_path, uploaded_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `, {
          bind: [
            projectId,
            file.filename,
            file.originalname,
            'reference',  // Assume 'reference' as default type for simplicity
            file.size,
            filePath,
            req.user ? req.user.id : null
          ]
        });

        return insertedFile[0];
      }));

      res.status(201).json({ message: 'Files uploaded successfully', attachments: uploadedFiles });
    } catch (error) {
      console.error('Error saving file information to database:', error);
      res.status(500).json({ message: 'Error uploading files', error: error.message });
    }
  });
};

// Get project files
const getProjectFiles = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const [files] = await sequelize.query(`
      SELECT id, filename, original_name, file_type, file_size, file_path, created_at as uploaded_at
      FROM project_attachments
      WHERE project_id = $1
      ORDER BY created_at DESC
    `, {
      bind: [projectId]
    });

    res.json(files);
  } catch (error) {
    console.error('Error fetching project files:', error);
    res.status(500).json({ message: 'Error fetching files', error: error.message });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  updateProjectDetails,
  uploadProjectFiles,
  getProjectFiles,
  getManagers,
  getUsers
};
