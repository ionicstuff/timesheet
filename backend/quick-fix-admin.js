const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

(async () => {
  try {
    await sequelize.query("UPDATE users SET role_id = 11 WHERE email = 'admin@company.com'");
    console.log('✅ Fixed admin role_id to 11 (Admin role)');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
})();
