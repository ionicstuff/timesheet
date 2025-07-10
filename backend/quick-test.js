const http = require('http');

function testConnection() {
  console.log('🔍 Testing database connection and basic API...\n');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Health Check Response:');
      console.log('Status:', res.statusCode);
      console.log('Data:', JSON.parse(data));
      console.log('\n🎉 Server is running successfully!');
      console.log('🔗 You can now test the API endpoints:');
      console.log('   - Health: http://localhost:3000/api/health');
      console.log('   - Register: POST http://localhost:3000/api/auth/register');
      console.log('   - Login: POST http://localhost:3000/api/auth/login');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Connection failed:', error.message);
    console.log('📝 Make sure the server is running with: npm run dev');
  });

  req.end();
}

testConnection();
