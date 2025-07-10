const http = require('http');
const https = require('https');

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
}

async function testFullAPI() {
  console.log('🧪 Testing Complete API Flow...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    
    console.log('✅ Health Check:', healthResponse.statusCode, healthResponse.data);
    
    // Test 2: Register User
    console.log('\n2️⃣ Testing User Registration...');
    const registerData = {
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '9893623268',
      password: 'Password123',
      department: 'Engineering',
      designation: 'Software Developer',
      dateOfJoining: '2024-01-15'
    };
    
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, registerData);
    
    console.log('✅ Register:', registerResponse.statusCode);
    if (registerResponse.statusCode === 201) {
      console.log('   User created successfully!');
      console.log('   Token received:', registerResponse.data.token ? 'Yes' : 'No');
    } else {
      console.log('   Error:', registerResponse.data);
    }
    
    // Test 3: Login User
    console.log('\n3️⃣ Testing User Login...');
    const loginData = {
      email: 'john.doe@example.com',
      password: 'Password123'
    };
    
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, loginData);
    
    console.log('✅ Login:', loginResponse.statusCode);
    if (loginResponse.statusCode === 200) {
      console.log('   Login successful!');
      console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
      
      // Test 4: Get Current User (Protected Route)
      console.log('\n4️⃣ Testing Protected Route...');
      const meResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      
      console.log('✅ Current User:', meResponse.statusCode);
      if (meResponse.statusCode === 200) {
        console.log('   User data retrieved successfully!');
        console.log('   User:', meResponse.data.user.firstName, meResponse.data.user.lastName);
      } else {
        console.log('   Error:', meResponse.data);
      }
    } else {
      console.log('   Login failed:', loginResponse.data);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('📝 Make sure the server is running with: npm run dev');
  }
}

// Run the tests
testFullAPI();
