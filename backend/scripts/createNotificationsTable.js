const db = require('../config/database');

async function createTable() {
  try {
    await db.authenticate();
    console.log('DB connected');
    const sql = `
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        link VARCHAR(500),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(sql);
    console.log('Notifications table ensured');
  } catch (e) {
    console.error('Failed to create notifications table', e);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

if (require.main === module) createTable();

module.exports = createTable;
