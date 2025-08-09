const { User } = require('./models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function getTestToken() {
  try {
    // Find an admin user
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role'],
      limit: 5
    });

    console.log('Available users in database:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName}) - Role: ${user.role}`);
    });

    if (users.length === 0) {
      console.log('No users found in database!');
      return;
    }

    // Use the first user for testing
    const testUser = users[0];
    console.log(`\nUsing user: ${testUser.email} (ID: ${testUser.id})`);

    // Generate a test JWT token
    const token = jwt.sign(
      { 
        id: testUser.id,
        email: testUser.email,
        role: testUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n=== TEST TOKEN ===');
    console.log(token);
    console.log('\n=== CURL COMMAND TO TEST PROFILE API ===');
    console.log(`curl -X GET "http://localhost:3000/api/users/profile" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

getTestToken();
