const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 Testing API Endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health:', healthResponse.data);

    // Test register endpoint
    console.log('\n2. Testing register endpoint...');
    const registerData = {
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      password: 'Password123',
      department: 'Engineering',
      designation: 'Software Developer',
      dateOfJoining: '2024-01-15'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    console.log('✅ Register:', registerResponse.data);

    const token = registerResponse.data.token;

    // Test login endpoint
    console.log('\n3. Testing login endpoint...');
    const loginData = {
      email: 'john.doe@example.com',
      password: 'Password123'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ Login:', loginResponse.data);

    // Test protected endpoint
    console.log('\n4. Testing protected endpoint...');
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Current User:', meResponse.data);

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAPI();
