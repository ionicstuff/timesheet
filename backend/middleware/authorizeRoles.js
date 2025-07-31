const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
require('dotenv').config();

// Middleware to check for specific roles
const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    // Try to get token from x-auth-token header first (for admin routes)
    let token = req.header('x-auth-token');
    
    // If not found, try Authorization header (for standard Bearer token)
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      const [users] = await sequelize.query(
        `SELECT u.role_id, rm.role_name 
         FROM users u 
         LEFT JOIN role_masters rm ON u.role_id = rm.id 
         WHERE u.id = $1 AND u.is_active = true`,
        { bind: [req.user.id] }
      );

      if (users.length === 0) {
        return res.status(403).json({ message: 'Access denied. User not found or inactive.' });
      }

      const userRole = users[0].role_name.toLowerCase();
      if (!allowedRoles.map(role => role.toLowerCase()).includes(userRole)) {
        return res.status(403).json({ message: `Access denied. Role '${userRole}' is not authorized.` });
      }

      next();
    } catch (err) {
      console.error(err.message);
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

module.exports = authorizeRoles;
