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

// Lightweight global search for quick-pick in project modal
router.get('/search', async (req, res, next) => {
  try {
    // Reuse controller filtering but force small page size and return minimal fields
    req.query.page = req.query.page || '1';
    req.query.limit = req.query.limit || '20';
    req.query.search = req.query.query || req.query.search || '';
    // call getAllUsers and then map minimal shape
    const _res = {
      json(payload){
        try{
          const users = (payload?.data?.users) || [];
          const minimal = users.map(u=>({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            department: u.department,
            designation: u.designation,
          }));
          res.json({ success:true, data:minimal });
        }catch(e){ next(e); }
      }
    };
    await getAllUsers(req, _res);
  } catch (e) {
    next(e);
  }
});

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
