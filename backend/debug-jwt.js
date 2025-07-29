const jwt = require('jsonwebtoken');

// Decode the JWT token from the test to see its structure
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzUzNzg1NDQzLCJleHAiOjE3NTQzOTAyNDN9.33rU_AKT6liJ8pfseNt7sgwfMAYYNW7xMtuMeLmIjgE';

try {
    const decoded = jwt.decode(token);
    console.log('JWT Payload:', decoded);
    
    // Try to verify it with our secret
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Verified JWT:', verified);
    
} catch (error) {
    console.error('JWT Error:', error.message);
}
