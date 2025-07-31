const sequelize = require('./config/database');

(async () => {
  try {
    // Check projects table
    const [projects] = await sequelize.query(`
      SELECT p.*, c.client_name, u.first_name, u.last_name 
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      WHERE p.project_name LIKE '%test%'
    `);
    console.log('Projects with manager info:', JSON.stringify(projects, null, 2));
    
    // Check all users
    const [users] = await sequelize.query('SELECT id, first_name, last_name FROM users');
    console.log('\nAll users:', JSON.stringify(users, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
