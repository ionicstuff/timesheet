const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log
  }
);

async function fixAdminRole() {
  try {
    console.log('🔧 Fixing admin user role...\n');
    
    // First, let's see the current admin user status
    console.log('Current admin user status:');
    const [currentUsers] = await sequelize.query(`
      SELECT 
        u.id, 
        u.email,
        u.role as legacy_role,
        u.role_id,
        rm.role_name,
        rm.level
      FROM users u
      LEFT JOIN role_masters rm ON u.role_id = rm.id
      WHERE u.email = 'admin@company.com'
    `);
    
    console.log('Current admin user:', currentUsers[0]);
    console.log('');
    
    // Check available roles
    console.log('Available roles:');
    const [roles] = await sequelize.query(`
      SELECT id, role_name, level FROM role_masters ORDER BY level
    `);
    
    console.log('Roles:', roles);
    console.log('');
    
    // Find the admin role (level 1 or role_name 'Admin')
    const adminRole = roles.find(r => r.level === 1 || r.role_name.toLowerCase() === 'admin');
    
    if (!adminRole) {
      console.log('❌ No admin role found! Creating one...');
      
      // Create admin role
      await sequelize.query(`
        INSERT INTO role_masters (role_name, level, description, is_active, created_at, updated_at)
        VALUES ('Admin', 1, 'Administrator with full access', true, NOW(), NOW())
        ON CONFLICT (role_name) DO NOTHING
      `);
      
      // Get the admin role again
      const [newRoles] = await sequelize.query(`
        SELECT id, role_name, level FROM role_masters 
        WHERE role_name = 'Admin' OR level = 1
        LIMIT 1
      `);
      
      adminRole = newRoles[0];
      console.log('✅ Created admin role:', adminRole);
    }
    
    // Update the admin user to have admin role
    console.log('Updating admin user role...');
    await sequelize.query(`
      UPDATE users 
      SET 
        role = 'admin',
        role_id = $1,
        updated_at = NOW()
      WHERE email = 'admin@company.com'
    `, {
      bind: [adminRole.id]
    });
    
    // Verify the update
    console.log('Verification - Updated admin user:');
    const [updatedUsers] = await sequelize.query(`
      SELECT 
        u.id, 
        u.email,
        u.role as legacy_role,
        u.role_id,
        rm.role_name,
        rm.level
      FROM users u
      LEFT JOIN role_masters rm ON u.role_id = rm.id
      WHERE u.email = 'admin@company.com'
    `);
    
    console.log('Updated admin user:', updatedUsers[0]);
    
    console.log('✅ Admin role fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing admin role:', error);
  } finally {
    await sequelize.close();
  }
}

fixAdminRole();
