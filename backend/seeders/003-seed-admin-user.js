const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check if admin role exists, if not create it
    const [adminRole] = await queryInterface.sequelize.query(
      `SELECT id FROM "RoleMasters" WHERE name = 'Admin' LIMIT 1;`
    );

    let adminRoleId;
    if (adminRole.length === 0) {
      // Create admin role if it doesn't exist
      const [roleResult] = await queryInterface.sequelize.query(
        `INSERT INTO "RoleMasters" (name, description, level, "createdAt", "updatedAt") 
         VALUES ('Admin', 'System Administrator with full access', 10, NOW(), NOW()) 
         RETURNING id;`
      );
      adminRoleId = roleResult[0].id;
    } else {
      adminRoleId = adminRole[0].id;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Check if admin user already exists
    const [existingAdmin] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE email = 'admin@company.com' LIMIT 1;`
    );

    if (existingAdmin.length === 0) {
      // Create admin user
      await queryInterface.sequelize.query(
        `INSERT INTO "Users" (username, email, password, "firstName", "lastName", "roleId", "isActive", "createdAt", "updatedAt")
         VALUES ('admin', 'admin@company.com', '${hashedPassword}', 'Admin', 'User', ${adminRoleId}, true, NOW(), NOW());`
      );
      
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@company.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove admin user
    await queryInterface.sequelize.query(
      `DELETE FROM "Users" WHERE email = 'admin@company.com';`
    );
    
    // Optionally remove admin role if no other users have it
    const [usersWithAdminRole] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM "Users" u 
       JOIN "RoleMasters" r ON u."roleId" = r.id 
       WHERE r.name = 'Admin';`
    );
    
    if (usersWithAdminRole[0].count === 0) {
      await queryInterface.sequelize.query(
        `DELETE FROM "RoleMasters" WHERE name = 'Admin';`
      );
    }
  }
};
