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

async function createAdminUser() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // First, check if admin role exists, if not create it
    const [adminRole] = await sequelize.query(
      `SELECT id FROM "role_masters" WHERE role_name = 'Admin' LIMIT 1;`
    );

    let adminRoleId;
    if (adminRole.length === 0) {
      console.log('🔄 Creating Admin role...');
      // Create admin role if it doesn't exist
      const [roleResult] = await sequelize.query(
        `INSERT INTO "role_masters" (role_code, role_name, description, level, can_manage_users, can_manage_projects, can_view_reports, created_at, updated_at) 
         VALUES ('ADMIN', 'Admin', 'System Administrator with full access', 1, true, true, true, NOW(), NOW()) 
         RETURNING id;`
      );
      adminRoleId = roleResult[0].id;
      console.log('✅ Admin role created successfully!');
    } else {
      adminRoleId = adminRole[0].id;
      console.log('ℹ️  Admin role already exists');
    }

    // Hash the password
    console.log('🔄 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Check if admin user already exists
    const [existingAdmin] = await sequelize.query(
      `SELECT id FROM "users" WHERE email = 'admin@company.com' LIMIT 1;`
    );

    if (existingAdmin.length === 0) {
      console.log('🔄 Creating admin user...');
      // Create admin user
      await sequelize.query(
        `INSERT INTO "users" (employee_id, email, password_hash, first_name, last_name, role_id, is_active, created_at, updated_at)
         VALUES ('admin', 'admin@company.com', $1, 'Admin', 'User', $2, true, NOW(), NOW());`,
        {
          bind: [hashedPassword, adminRoleId]
        }
      );
      
      console.log('\n🎉 Admin user created successfully!');
      console.log('📧 Email: admin@company.com');
      console.log('🔑 Password: admin123');
      console.log('\nYou can now login to the admin panel at: http://localhost:3001/admin/login');
    } else {
      console.log('ℹ️  Admin user already exists');
      console.log('📧 Email: admin@company.com');
      console.log('🔑 Password: admin123');
      console.log('\nYou can login to the admin panel at: http://localhost:3001/admin/login');
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed.');
  }
}

createAdminUser();
