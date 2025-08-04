const request = require('supertest');
const app = require('../app'); // Assuming app.js exports your Express app

// Test for getProject endpoint
async function testGetProject() {
  try {
    const projectId = 1; // Change this to an existing project ID for testing
    const response = await request(app).get(`/api/projects/${projectId}`);
    console.log('Status Code:', response.status);
    console.log('Response Body:', response.body);
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
(async () => {
  await testGetProject();
})();
