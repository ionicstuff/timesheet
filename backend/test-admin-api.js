const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAdminAPI() {
    try {
        console.log('🔍 Testing Admin API...\n');
        
        // Step 1: Login as admin to get token
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@company.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful, token received');
        console.log('User data:', loginResponse.data.user);
        console.log('Token preview:', token.substring(0, 20) + '...\n');
        
        // Step 2: Test admin users endpoint
        console.log('2. Testing /api/admin/users endpoint...');
        const usersResponse = await axios.get(`${API_URL}/admin/users`, {
            headers: {
                'x-auth-token': token
            }
        });
        
        console.log('✅ Users endpoint successful');
        console.log('Users count:', usersResponse.data.length);
        console.log('First user:', usersResponse.data[0]);
        console.log('');
        
        // Step 3: Test admin roles endpoint
        console.log('3. Testing /api/admin/roles endpoint...');
        const rolesResponse = await axios.get(`${API_URL}/admin/roles`, {
            headers: {
                'x-auth-token': token
            }
        });
        
        console.log('✅ Roles endpoint successful');
        console.log('Roles count:', rolesResponse.data.length);
        console.log('First role:', rolesResponse.data[0]);
        console.log('');
        
        // Step 4: Test dashboard stats
        console.log('4. Testing /api/admin/dashboard/stats endpoint...');
        const statsResponse = await axios.get(`${API_URL}/admin/dashboard/stats`, {
            headers: {
                'x-auth-token': token
            }
        });
        
        console.log('✅ Dashboard stats successful');
        console.log('Stats:', statsResponse.data);
        console.log('');
        
        console.log('🎉 All admin API tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        console.error('Full error:', error);
    }
}

// Run the test
testAdminAPI();
