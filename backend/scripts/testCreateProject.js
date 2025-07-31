const axios = require('axios');

async function testCreateProject() {
    try {
        // Mock valid token and creator ID with Account Manager role
        const token = 'your_jwt_token_here';
        const accountManagerUser = {
            id: 4,  // assuming "E-002 Akash Gawand" is an Account Manager
            firstName: 'Akash',
            lastName: 'Gawand',
        };
        
        const projectData = {
            name: 'New Sample Project',
            description: 'A project created for testing purposes.',
            clientId: 1,  // assuming this client ID exists
            spocId: 1,  // assuming this SPOC ID exists
            startDate: '2025-08-01',
            endDate: '2025-12-31',
            isActive: true,
            // Not providing managerId intentionally
        };

        const response = await axios.post('http://localhost:3000/api/projects', projectData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            auth: {
                username: accountManagerUser.firstName,
                password: 'password'  // provide valid account manager password here
            }
        });

        console.log('Project creation response:', response.data);
    } catch (error) {
        console.error('Error creating project:', error.response ? error.response.data : error.message);
    }
}

testCreateProject();
