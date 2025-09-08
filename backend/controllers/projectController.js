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
        u.last_name as manager_last_name,
        COALESCE(tc.total_tasks, 0) AS tasks_count,
        COALESCE(tc.open_tasks, 0) AS open_tasks_count,
        COALESCE(mc.members, 0) AS members_count,
        -- Allocated hours (preferred: estimated_time, fallback: estimated_hours, else sum of task estimated_time)
        COALESCE(
          p.estimated_time,
          p.estimated_hours,
          (SELECT COALESCE(SUM(t.estimated_time), 0) FROM tasks t WHERE t.project_id = p.id)
        ) AS allocated_hours,
        -- Totals from time sources
        COALESCE((SELECT SUM(te.minutes) FROM timesheet_entries te WHERE te.project_id = p.id), 0) AS total_minutes,
        COALESCE((SELECT SUM(ts.total_tracked_seconds) FROM tasks ts WHERE ts.project_id = p.id), 0) AS total_seconds,
        -- Actual hours is the greater of timesheet hours and task timer hours
        GREATEST(
          COALESCE((SELECT SUM(te2.minutes) FROM timesheet_entries te2 WHERE te2.project_id = p.id), 0) / 60.0,
          COALESCE((SELECT SUM(ts2.total_tracked_seconds) FROM tasks ts2 WHERE ts2.project_id = p.id), 0) / 3600.0
        ) AS actual_hours_calc,
        -- Flags for UI
        CASE 
          WHEN p.status = 'completed' 
            AND COALESCE(
                  p.estimated_time, p.estimated_hours,
                  (SELECT COALESCE(SUM(t3.estimated_time), 0) FROM tasks t3 WHERE t3.project_id = p.id)
                ) IS NOT NULL
            AND GREATEST(
                  COALESCE((SELECT SUM(te3.minutes) FROM timesheet_entries te3 WHERE te3.project_id = p.id), 0) / 60.0,
                  COALESCE((SELECT SUM(ts3.total_tracked_seconds) FROM tasks ts3 WHERE ts3.project_id = p.id), 0) / 3600.0
                ) <= COALESCE(
                  p.estimated_time, p.estimated_hours,
                  (SELECT COALESCE(SUM(t4.estimated_time), 0) FROM tasks t4 WHERE t4.project_id = p.id)
                )
          THEN TRUE ELSE FALSE END AS completed_on_time,
        CASE 
          WHEN p.status <> 'completed' AND p.end_date IS NOT NULL AND CURRENT_DATE > p.end_date
          THEN TRUE ELSE FALSE END AS is_delayed,
        CASE 
          WHEN p.status <> 'completed' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL 
               AND CURRENT_DATE >= (p.end_date - CEIL(((p.end_date - p.start_date)::numeric * 0.1))::int)
               AND CURRENT_DATE <= p.end_date
          THEN TRUE ELSE FALSE END AS approaching_deadline,
        -- Final color for status badge
        CASE 
          WHEN p.status = 'completed' 
            AND COALESCE(
                  p.estimated_time, p.estimated_hours,
                  (SELECT COALESCE(SUM(t5.estimated_time), 0) FROM tasks t5 WHERE t5.project_id = p.id)
                ) IS NOT NULL
            AND GREATEST(
                  COALESCE((SELECT SUM(te5.minutes) FROM timesheet_entries te5 WHERE te5.project_id = p.id), 0) / 60.0,
                  COALESCE((SELECT SUM(ts5.total_tracked_seconds) FROM tasks ts5 WHERE ts5.project_id = p.id), 0) / 3600.0
                ) <= COALESCE(
                  p.estimated_time, p.estimated_hours,
                  (SELECT COALESCE(SUM(t6.estimated_time), 0) FROM tasks t6 WHERE t6.project_id = p.id)
                )
          THEN 'green'
          WHEN (
            p.status = 'completed' 
            AND COALESCE(
                  p.estimated_time, p.estimated_hours,
                  (SELECT COALESCE(SUM(t7.estimated_time), 0) FROM tasks t7 WHERE t7.project_id = p.id)
                ) IS NOT NULL
            AND GREATEST(
                  COALESCE((SELECT SUM(te7.minutes) FROM timesheet_entries te7 WHERE te7.project_id = p.id), 0) / 60.0,
                  COALESCE((SELECT SUM(ts7.total_tracked_seconds) FROM tasks ts7 WHERE ts7.project_id = p.id), 0) / 3600.0
                ) > COALESCE(
                  p.estimated_time, p.estimated_hours,
                  (SELECT COALESCE(SUM(t8.estimated_time), 0) FROM tasks t8 WHERE t8.project_id = p.id)
                )
          ) OR (p.status <> 'completed' AND p.end_date IS NOT NULL AND CURRENT_DATE > p.end_date)
          THEN 'red'
          WHEN p.status <> 'completed' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL 
               AND CURRENT_DATE >= (p.end_date - CEIL(((p.end_date - p.start_date)::numeric * 0.1))::int)
               AND CURRENT_DATE <= p.end_date
          THEN 'orange'
          ELSE NULL
        END AS status_color
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      LEFT JOIN (
        SELECT 
          t.project_id,
          COUNT(*) AS total_tasks,
          SUM(CASE WHEN t.status <> 'completed' THEN 1 ELSE 0 END) AS open_tasks
        FROM tasks t
        GROUP BY t.project_id
      ) tc ON tc.project_id = p.id
      LEFT JOIN (
        SELECT 
          t.project_id,
          COUNT(DISTINCT t.assigned_to) AS members
        FROM tasks t
        WHERE t.assigned_to IS NOT NULL
        GROUP BY t.project_id
      ) mc ON mc.project_id = p.id
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
      status: project.status, // include current status so UI can show Completed
      closedAt: project.closed_at,
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
      // Aggregate stats
      tasksCount: Number(project.tasks_count) || 0,
      openTasksCount: Number(project.open_tasks_count) || 0,
      membersCount: Number(project.members_count) || 0,
      // Performance and timeline indicators for UI badges
      allocatedHours: project.allocated_hours != null ? Number(project.allocated_hours) : null,
      actualHours: project.actual_hours_calc != null ? Number(project.actual_hours_calc) : null,
      completedOnTime: !!project.completed_on_time,
      isDelayed: !!project.is_delayed,
      approachingDeadline: !!project.approaching_deadline,
      statusColor: project.status_color || null
    }));

    res.json(transformedProjects);
  } catch (error) {

    console.error('Error fetching projects from the database:', error);
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
        u.last_name as manager_last_name,
        t.id as task_id,
        t.name as task_name,
        t.assigned_to,
        us.first_name as assigned_first_name,
        us.last_name as assigned_last_name,
        pa.id as attachment_id,
        pa.filename,
        pa.original_name,
        pa.file_path,
        us.department
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN users us ON t.assigned_to = us.id
      LEFT JOIN project_attachments pa ON p.id = pa.project_id
      WHERE p.id = $1
    `, {
      bind: [id]
    });

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Aggregate data from the result set
    const project = projects[0];
    
    // Extract unique team members from tasks
    const teamMembers = [];
    const seenUsers = new Set();
    
    projects.forEach(p => {
      if (p.assigned_to && p.assigned_first_name && !seenUsers.has(p.assigned_to)) {
        teamMembers.push({
          taskName: p.task_name,
          assignedTo: {
            firstName: p.assigned_first_name,
            lastName: p.assigned_last_name,
            department: p.department
          }
        });
        seenUsers.add(p.assigned_to);
      }
    });
    
    // Extract unique documents
    const documents = [];
    const seenFiles = new Set();
    
    projects.forEach(p => {
      if (p.attachment_id && !seenFiles.has(p.attachment_id)) {
        documents.push({
          filename: p.filename,
          originalName: p.original_name,
          filePath: p.file_path
        });
        seenFiles.add(p.attachment_id);
      }
    });

    // Extract unique tasks by task id to avoid duplicates from attachment joins
    const tasks = [];
    const seenTaskIds = new Set();
    projects.forEach(p => {
      if (p.task_id && !seenTaskIds.has(p.task_id)) {
        tasks.push(p.task_name);
        seenTaskIds.add(p.task_id);
      }
    });
    
    // Get additional project information including SPOC details
    const [spocData] = await sequelize.query(`
      SELECT 
        s.name as spoc_name,
        s.email as spoc_email,
        s.phone as spoc_phone,
        s.designation as spoc_designation,
        s.department as spoc_department
      FROM spocs s
      WHERE s.id = (SELECT spoc_id FROM projects WHERE id = $1)
    `, {
      bind: [id]
    });
    
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
        lastName: project.manager_last_name,
        fullName: project.manager_first_name && project.manager_last_name 
          ? `${project.manager_first_name} ${project.manager_last_name}` 
          : null
      },
      spoc: spocData.length > 0 ? {
        name: spocData[0].spoc_name,
        email: spocData[0].spoc_email,
        phone: spocData[0].spoc_phone,
        designation: spocData[0].spoc_designation,
        department: spocData[0].spoc_department
      } : null,
      teamMembers: teamMembers,
      tasks: tasks, // list of task names (deduped by task id)
      documents: documents,
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

const { Project, Task, Client } = require('../models');
const emailService = require('../services/emailService');

const closeProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    // Ensure project exists
    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Ensure the actor is the assigned Project Manager OR the Client's Account Manager
    const client = project.clientId ? await Client.findByPk(project.clientId) : null;
    const isAssignedPM = project.projectManagerId && project.projectManagerId === req.user.id;
    const isAssignedAM = client?.accountManagerId && client.accountManagerId === req.user.id;
    if (!isAssignedPM && !isAssignedAM) {
      return res.status(403).json({ message: 'Only the assigned Project Manager or Account Manager can close this project' });
    }

    // Require all tasks to be completed and no running timers
    const { Op } = require('sequelize');
    const openCount = await Task.count({ where: { projectId: id, status: { [Op.ne]: 'completed' } } });
    const runningCount = await Task.count({ where: { projectId: id, activeTimerStartedAt: { [Op.ne]: null } } });
    if (openCount > 0 || runningCount > 0) {
      return res.status(400).json({ message: 'Cannot close project until all tasks are completed and no timers are running' });
    }

    project.status = 'completed';
    project.closedAt = new Date();
    project.closedByUserId = req.user.id;
    project.closedReason = reason || project.closedReason;
    await project.save();

    void emailService.sendProjectClosedEmail(project, req.user, reason).catch(() => {});

    res.json({ message: 'Project closed successfully', project });
  } catch (error) {
    console.error('Error closing project:', error);
    res.status(500).json({ message: 'Error closing project', error: error.message });
  }
};

// Calculate project performance
const getProjectPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch project basic info and allocation fields
    const [projects] = await sequelize.query(`
      SELECT 
        p.id,
        p.project_name,
        p.estimated_time,
        p.estimated_hours
      FROM projects p
      WHERE p.id = $1
    `, { bind: [id] });

    if (!projects || projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projects[0];

    // Sum timesheet minutes for this project
    const [tsRows] = await sequelize.query(`
      SELECT COALESCE(SUM(minutes), 0) AS total_minutes
      FROM timesheet_entries
      WHERE project_id = $1
    `, { bind: [id] });
    const timesheetMinutes = Number(tsRows?.[0]?.total_minutes || 0);

    // Sum task tracked seconds for this project (from task timers)
    const [timerRows] = await sequelize.query(`
      SELECT COALESCE(SUM(total_tracked_seconds), 0) AS total_seconds
      FROM tasks
      WHERE project_id = $1
    `, { bind: [id] });
    const taskSeconds = Number(timerRows?.[0]?.total_seconds || 0);

    // Sum tasks' estimated_time as a potential fallback allocation
    const [taskEstRows] = await sequelize.query(`
      SELECT COALESCE(SUM(estimated_time), 0) AS sum_est_hours
      FROM tasks
      WHERE project_id = $1
    `, { bind: [id] });
    const tasksEstimatedHours = Number(taskEstRows?.[0]?.sum_est_hours || 0);

    // Count tasks
    const [taskCountRows] = await sequelize.query(`
      SELECT COUNT(*)::int AS cnt
      FROM tasks
      WHERE project_id = $1
    `, { bind: [id] });
    const tasksCount = Number(taskCountRows?.[0]?.cnt || 0);

    const timesheetHours = timesheetMinutes / 60.0;
    const taskTimerHours = taskSeconds / 3600.0;

    // Choose actual hours as the larger of the two sources to avoid double-counting if both systems are used.
    // If only one system is used, that one will dominate.
    const actualHours = Math.max(timesheetHours, taskTimerHours);

    // Determine allocated hours with sensible fallbacks
    let allocatedHours = null;
    if (project.estimated_time != null) {
      allocatedHours = Number(project.estimated_time);
    } else if (project.estimated_hours != null) {
      allocatedHours = Number(project.estimated_hours);
    } else if (tasksEstimatedHours > 0) {
      allocatedHours = tasksEstimatedHours;
    }

    if (allocatedHours == null) {
      return res.status(422).json({
        message: 'Allocated hours not set for this project',
        hint: 'Set projects.estimated_time (preferred) or provide per-task estimated_time values.',
        metrics: {
          projectId: project.id,
          projectName: project.project_name,
          actualHours: Number(actualHours.toFixed(2)),
          timesheetHours: Number(timesheetHours.toFixed(2)),
          taskTimerHours: Number(taskTimerHours.toFixed(2)),
          tasksEstimatedHours: Number(tasksEstimatedHours.toFixed(2)),
          tasksCount
        }
      });
    }

    const varianceHours = actualHours - allocatedHours; // >0 means overrun, <0 under budget
    const performanceRatio = allocatedHours > 0 ? actualHours / allocatedHours : null;
    const status = actualHours <= allocatedHours ? 'good' : 'bad';

    return res.json({
      projectId: project.id,
      projectName: project.project_name,
      allocatedHours: Number(allocatedHours.toFixed(2)),
      actualHours: Number(actualHours.toFixed(2)),
      varianceHours: Number(varianceHours.toFixed(2)),
      performanceRatio: performanceRatio != null ? Number(performanceRatio.toFixed(4)) : null,
      status,
      tasksCount,
      breakdown: {
        timesheetHours: Number(timesheetHours.toFixed(2)),
        taskTimerHours: Number(taskTimerHours.toFixed(2)),
        tasksEstimatedHours: Number(tasksEstimatedHours.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error calculating project performance:', error);
    return res.status(500).json({ message: 'Error calculating project performance', error: error.message });
  }
};

// Get only the projects accessible to the current user (created by them or assigned via tasks)
const getMyProjects = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId; // supports both auth middlewares

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [rows] = await sequelize.query(`
      SELECT DISTINCT p.id, p.project_name
      FROM projects p
      WHERE p.created_by = $1
         OR p.project_manager_id = $1
         OR EXISTS (
              SELECT 1 FROM tasks t
              WHERE t.project_id = p.id AND t.assigned_to = $1
            )
      ORDER BY p.project_name ASC
    `, { bind: [userId] });

    const projects = rows.map(r => ({ id: r.id, projectName: r.project_name, name: r.project_name }));
    return res.json(projects);
  } catch (error) {
    console.error('Error fetching my projects:', error);
    return res.status(500).json({ message: 'Error fetching my projects', error: error.message });
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
  getUsers,
  closeProject,
  getProjectPerformance,
  getMyProjects
};
