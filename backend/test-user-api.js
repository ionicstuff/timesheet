const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test user data
const testUser = {
  employeeId: 'EMP001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  password: 'TestPass123',
  department: 'Engineering',
  designation: 'Software Engineer',
  dateOfJoining: '2024-01-01'
};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
      data
    };
    
    const response = await axios(config);
    console.log(`✅ ${method.toUpperCase()} ${url}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${url}:`, error.response?.data || error.message);
    return null;
  }
};

// Test functions
async function testLogin() {
  console.log('\n🔐 Testing Login...');
  const loginData = await makeRequest('post', '/auth/login', {
    email: 'admin@example.com', // Use existing admin user
    password: 'admin123'
  });
  
  if (loginData && loginData.token) {
    authToken = loginData.token;
    console.log('🔑 Authentication token obtained');
    return true;
  }
  return false;
}

async function testGetAllUsers() {
  console.log('\n👥 Testing Get All Users...');
  await makeRequest('get', '/users?page=1&limit=10');
}

async function testGetUserStats() {
  console.log('\n📊 Testing Get User Stats...');
  await makeRequest('get', '/users/stats');
}

async function testGetTeamMembers() {
  console.log('\n👥 Testing Get Team Members...');
  await makeRequest('get', '/users/team');
}

async function testCreateUser() {
  console.log('\n➕ Testing Create User...');
  const result = await makeRequest('post', '/users', testUser);
  return result?.data?.id;
}

async function testGetUserById(userId) {
  console.log(`\n👤 Testing Get User By ID (${userId})...`);
  await makeRequest('get', `/users/${userId}`);
}

async function testUpdateUser(userId) {
  console.log(`\n✏️ Testing Update User (${userId})...`);
  await makeRequest('put', `/users/${userId}`, {
    firstName: 'Jane',
    lastName: 'Smith',
    designation: 'Senior Software Engineer'
  });
}

async function testUpdateUserHierarchy(userId) {
  console.log(`\n🏢 Testing Update User Hierarchy (${userId})...`);
  await makeRequest('put', `/users/${userId}/hierarchy`, {
    hierarchyLevel: 3,
    relationshipType: 'direct_report'
  });
}

async function testDeactivateUser(userId) {
  console.log(`\n🚫 Testing Deactivate User (${userId})...`);
  await makeRequest('delete', `/users/${userId}`);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting User API Tests...');
  console.log('=====================================');
  
  // Login first
  const isAuthenticated = await testLogin();
  if (!isAuthenticated) {
    console.log('❌ Authentication failed. Cannot proceed with tests.');
    return;
  }
  
  // Run tests
  await testGetAllUsers();
  await testGetUserStats();
  await testGetTeamMembers();
  
  // Create, test, and cleanup
  const createdUserId = await testCreateUser();
  if (createdUserId) {
    await testGetUserById(createdUserId);
    await testUpdateUser(createdUserId);
    await testUpdateUserHierarchy(createdUserId);
    await testDeactivateUser(createdUserId);
  }
  
  console.log('\n✅ All tests completed!');
  console.log('=====================================');
}

// Handle process exit
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// Run tests
runTests().catch(console.error);
