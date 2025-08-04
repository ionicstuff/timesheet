const sequelize = require('../config/database');

async function testProjectQuery() {
  try {
    console.log('Testing getProject query...\n');
    
    // First, let's check if we have any projects
    const [allProjects] = await sequelize.query(`
      SELECT id, project_name FROM projects LIMIT 5
    `);
    
    console.log('Available projects:');
    console.log(allProjects);
    
    if (allProjects.length === 0) {
      console.log('No projects found in database');
      return;
    }
    
    const projectId = allProjects[0].id;
    console.log(`\nTesting with project ID: ${projectId}\n`);
    
    // Test the main query
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
        t.name as task_name,
        t.assigned_to,
        us.first_name as assigned_first_name,
        us.last_name as assigned_last_name,
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
      bind: [projectId]
    });

    console.log('Query results:');
    console.log('Number of rows returned:', projects.length);
    
    if (projects.length > 0) {
      console.log('\nFirst row:');
      console.log(projects[0]);
      
      // Check what data we have
      const project = projects[0];
      console.log('\n=== PROJECT INFO ===');
      console.log('Project Name:', project.project_name);
      console.log('Client Name:', project.client_name);
      console.log('Manager:', project.manager_first_name, project.manager_last_name);
      
      console.log('\n=== TASKS ===');
      const tasks = projects.filter(p => p.task_name).map(p => ({
        taskName: p.task_name,
        assignedTo: `${p.assigned_first_name} ${p.assigned_last_name}`,
        department: p.department
      }));
      console.log('Tasks found:', tasks.length);
      tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.taskName} - ${task.assignedTo} (${task.department})`);
      });
      
      console.log('\n=== DOCUMENTS ===');
      const documents = projects.filter(p => p.filename).map(p => ({
        filename: p.filename,
        originalName: p.original_name
      }));
      console.log('Documents found:', documents.length);
      documents.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.originalName} (${doc.filename})`);
      });
    }
    
    // Test SPOC query
    console.log('\n=== SPOC INFO ===');
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
      bind: [projectId]
    });
    
    console.log('SPOC data:', spocData);
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testProjectQuery();
