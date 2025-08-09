const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  getUserProfile,
  getTeamMembers,
  getTeamMembersByManagerId,
  createUser,
  updateUser,
  deactivateUser,
  getUserStats,
  updateUserHierarchy,
  createUserValidation,
  updateUserValidation,
  userIdValidation,
  hierarchyValidation
} = require('../controllers/userController');

const { authMiddleware } = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// @route   GET /api/users
// @desc    Get all users with filtering and pagination
// @access  Private (HR, Admin, Manager)
router.get('/', 
  authorizeRoles(['admin', 'hr', 'manager']), 
  getAllUsers
);

// @route   GET /api/users/stats
// @desc    Get user statistics and dashboard data
// @access  Private (HR, Admin, Manager)
router.get('/stats', 
  authorizeRoles(['admin', 'hr', 'manager']), 
  getUserStats
);

// @route   GET /api/users/profile
// @desc    Get current user's complete profile information
// @access  Private (All authenticated users)
router.get('/profile', 
  getUserProfile
);

// @route   GET /api/users/team
// @desc    Get team members for current user (manager/account manager)
// @access  Private (Manager, Account Manager, Admin)
router.get('/team', 
  getTeamMembers
);

// @route   GET /api/users/:managerId/team
// @desc    Get team members by manager ID (for admin/hr to view any manager's team)
// @access  Private (HR, Admin)
router.get('/:managerId/team', 
  authorizeRoles(['admin', 'hr']),
  userIdValidation,
  getTeamMembersByManagerId
);

// @route   GET /api/users/:userId
// @desc    Get user by ID with detailed information
// @access  Private (HR, Admin, Manager, or own profile)
router.get('/:userId', 
  userIdValidation,
  getUserById
);

// @route   POST /api/users
// @desc    Create new user
// @access  Private (HR, Admin)
router.post('/', 
  authorizeRoles(['admin', 'hr']),
  createUserValidation,
  createUser
);

// @route   PUT /api/users/:userId
// @desc    Update user information
// @access  Private (HR, Admin, or own profile)
router.put('/:userId', 
  updateUserValidation,
  updateUser
);

// @route   PUT /api/users/:userId/hierarchy
// @desc    Update user hierarchy (assign/change manager)
// @access  Private (HR, Admin)
router.put('/:userId/hierarchy', 
  authorizeRoles(['admin', 'hr']),
  hierarchyValidation,
  updateUserHierarchy
);

// @route   DELETE /api/users/:userId
// @desc    Deactivate user (soft delete)
// @access  Private (HR, Admin)
router.delete('/:userId', 
  authorizeRoles(['admin', 'hr']),
  userIdValidation,
  deactivateUser
);

module.exports = router;
