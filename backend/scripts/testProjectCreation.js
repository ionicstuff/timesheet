const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'evolute-timesheet',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'aditya',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function testProjectCreation() {
  try {
    console.log('🚀 Starting Project Creation Test...\n');

    // Step 1: Find an Account Manager user
    console.log('📋 Step 1: Finding Account Manager users...');
    const [accountManagers] = await sequelize.query(`
      SELECT u.id, u.employee_id, u.first_name, u.last_name, rm.role_code, rm.role_name
      FROM users u
      LEFT JOIN role_masters rm ON u.role_id = rm.id
      WHERE rm.role_code = 'ACM' AND u.is_active = true
      LIMIT 1
    `);

    if (accountManagers.length === 0) {
      console.log('❌ No Account Manager found. Creating a test Account Manager...');
      // Create a test account manager
      const [acmRole] = await sequelize.query(`SELECT id FROM role_masters WHERE role_code = 'ACM'`);
      if (acmRole.length === 0) {
        console.log('❌ Account Manager role not found in database');
        return;
      }

      await sequelize.query(`
        INSERT INTO users (employee_id, email, password_hash, first_name, last_name, role_id, is_active, created_at, updated_at)
        VALUES ('TEST-ACM', 'testacm@example.com', 'hashedpassword', 'Test', 'AccountManager', $1, true, NOW(), NOW())
      `, { bind: [acmRole[0].id] });

      console.log('✅ Test Account Manager created');
      // Re-fetch the account manager
      const [newAccountManagers] = await sequelize.query(`
        SELECT u.id, u.employee_id, u.first_name, u.last_name, rm.role_code, rm.role_name
        FROM users u
        LEFT JOIN role_masters rm ON u.role_id = rm.id
        WHERE rm.role_code = 'ACM' AND u.employee_id = 'TEST-ACM'
      `);
      accountManagers.push(newAccountManagers[0]);
    }

    const accountManager = accountManagers[0];
    console.log(`✅ Found Account Manager: ${accountManager.first_name} ${accountManager.last_name} (ID: ${accountManager.id})`);

    // Step 2: Find existing client and create a SPOC if needed
    console.log('\n📋 Step 2: Finding client and SPOC...');
    const [clients] = await sequelize.query(`SELECT id, client_name FROM clients WHERE is_active = true LIMIT 1`);
    
    if (clients.length === 0) {
      console.log('❌ No active client found. Please create a client first.');
      return;
    }

    const client = clients[0];
    console.log(`✅ Found client: ${client.client_name} (ID: ${client.id})`);

    // Create a test SPOC (assuming SPOC is a user)
    const [spocUsers] = await sequelize.query(`SELECT id FROM users WHERE is_active = true LIMIT 1`);
    const spocId = spocUsers[0].id;

    // Step 3: Test project creation without explicit manager
    console.log('\n📋 Step 3: Creating project without explicit manager...');
    
    const projectName = `Test Project ${Date.now()}`;
    const projectCode = projectName.toUpperCase().replace(/\\s+/g, '_').substring(0, 20);

    const [projectResult] = await sequelize.query(`
      INSERT INTO projects (project_code, project_name, description, client_id, spoc_id, project_manager_id, start_date, end_date, is_active, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `, {
      bind: [
        projectCode,
        projectName,
        'Test project created by script',
        client.id,
        spocId,
        accountManager.id, // This simulates the auto-assignment logic
        '2025-08-01',
        '2025-12-31',
        true,
        accountManager.id
      ]
    });

    const project = projectResult[0];
    console.log(`✅ Project created: ${project.project_name} (ID: ${project.id})`);
    console.log(`✅ Project manager auto-assigned: ${accountManager.first_name} ${accountManager.last_name} (ID: ${project.project_manager_id})`);

    // Step 4: Verify the result
    console.log('\n📋 Step 4: Verifying project creation...');
    const [verificationResult] = await sequelize.query(`
      SELECT 
        p.id,
        p.project_name,
        p.project_manager_id,
        u.first_name as manager_first_name,
        u.last_name as manager_last_name,
        rm.role_name as manager_role
      FROM projects p
      LEFT JOIN users u ON p.project_manager_id = u.id
      LEFT JOIN role_masters rm ON u.role_id = rm.id
      WHERE p.id = $1
    `, { bind: [project.id] });

    const verifiedProject = verificationResult[0];
    
    if (verifiedProject.project_manager_id === accountManager.id) {
      console.log('🎉 SUCCESS: Project manager was correctly auto-assigned!');
      console.log(`   Project: ${verifiedProject.project_name}`);
      console.log(`   Manager: ${verifiedProject.manager_first_name} ${verifiedProject.manager_last_name}`);
      console.log(`   Manager Role: ${verifiedProject.manager_role}`);
    } else {
      console.log('❌ FAILED: Project manager was not correctly assigned');
    }

    // Step 5: Test with explicit manager (should not auto-assign)
    console.log('\n📋 Step 5: Testing with explicit manager (should not auto-assign)...');
    
    // Find a different user to be the explicit manager
    const [otherUsers] = await sequelize.query(`
      SELECT id, first_name, last_name FROM users 
      WHERE id != $1 AND is_active = true LIMIT 1
    `, { bind: [accountManager.id] });

    if (otherUsers.length > 0) {
      const explicitManager = otherUsers[0];
      const projectName2 = `Test Project Explicit ${Date.now()}`;
      const projectCode2 = projectName2.toUpperCase().replace(/\\s+/g, '_').substring(0, 20);

      const [projectResult2] = await sequelize.query(`
        INSERT INTO projects (project_code, project_name, description, client_id, spoc_id, project_manager_id, start_date, end_date, is_active, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `, {
        bind: [
          projectCode2,
          projectName2,
          'Test project with explicit manager',
          client.id,
          spocId,
          explicitManager.id, // Explicit manager provided
          '2025-08-01',
          '2025-12-31',
          true,
          accountManager.id
        ]
      });

      console.log(`✅ Project created with explicit manager: ${projectResult2[0].project_name}`);
      console.log(`✅ Manager assigned: ${explicitManager.first_name} ${explicitManager.last_name} (ID: ${explicitManager.id})`);
      
      if (projectResult2[0].project_manager_id === explicitManager.id) {
        console.log('🎉 SUCCESS: Explicit manager assignment works correctly!');
      } else {
        console.log('❌ FAILED: Explicit manager assignment failed');
      }
    }

    console.log('\n🎯 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testProjectCreation();
