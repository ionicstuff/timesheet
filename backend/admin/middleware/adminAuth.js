const jwt = require('jsonwebtoken');
const sequelize = require('../../config/database');
require('dotenv').config();

const adminAuthMiddleware = async (req, res, next) => {
    const token = req.header('x-auth-token');
    
    console.log('=== Admin Auth Debug ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Token received:', token ? 'YES' : 'NO');
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'none');

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        // JWT verification successful

        // Check if the user is an admin based on role using raw SQL
        const [users] = await sequelize.query(`
            SELECT 
                u.id, 
                u.email,
                u.role as legacy_role,
                rm.role_name,
                rm.level
            FROM users u
            LEFT JOIN role_masters rm ON u.role_id = rm.id
            WHERE u.id = $1 AND u.is_active = true
            LIMIT 1
        `, {
            bind: [req.user.id]
        });

        if (users.length === 0) {
            return res.status(403).json({ message: 'Access denied. User not found or inactive.' });
        }

        const user = users[0];
        
        // Check if user has admin role (either legacy role 'admin' or role_name 'Admin')
        const isAdmin = user.legacy_role === 'admin' || 
                       (user.role_name && user.role_name.toLowerCase() === 'admin') ||
                       user.level === 1; // Level 1 is typically admin level

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        next();
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = adminAuthMiddleware;
