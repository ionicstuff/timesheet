const { body, validationResult, param } = require('express-validator');
const { User, UserHierarchy, RoleMaster, Client, Project } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all users with filtering and pagination
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      department = '',
      role = '',
      isActive = '',
      sortBy = 'firstName',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause for filtering
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeId: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (department) {
      whereClause.department = department;
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (isActive !== '') {
      whereClause.isActive = isActive === 'true';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: RoleMaster,
          as: 'roleMaster',
          attributes: ['id', 'roleCode', 'roleName', 'level']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// Get user by ID with detailed information
const getUserById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      include: [
        {
          model: RoleMaster,
          as: 'roleMaster',
          attributes: ['id', 'roleCode', 'roleName', 'description', 'level']
        },
        {
          model: UserHierarchy,
          as: 'hierarchyAsUser',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: User,
              as: 'parentUser',
              attributes: ['id', 'firstName', 'lastName', 'email', 'designation']
            }
          ]
        },
        {
          model: UserHierarchy,
          as: 'hierarchyAsParent',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email', 'designation']
            }
          ]
        },
        {
          model: Client,
          as: 'managedClients',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'clientName', 'email', 'status']
        },
        {
          model: Project,
          as: 'managedProjects',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'projectName', 'status', 'startDate', 'endDate']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

// Get team members by manager ID (for admin/hr to view any manager's team)
const getTeamMembersByManagerId = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { managerId } = req.params;
    const {
      includeSubordinates = false,
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'firstName',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Verify that the manager exists
    const manager = await User.findByPk(managerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // Get direct reports for the specified manager
    let teamMemberIds = [];
    
    const directReports = await UserHierarchy.findAll({
      where: {
        parentUserId: managerId,
        isActive: true,
        effectiveFrom: { [Op.lte]: new Date() },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: new Date() } }
        ]
      },
      attributes: ['userId']
    });

    teamMemberIds = directReports.map(report => report.userId);

    // If includeSubordinates is true, get all subordinates recursively
    if (includeSubordinates === 'true') {
      const getAllSubordinates = async (parentIds) => {
        if (parentIds.length === 0) return [];
        
        const subordinates = await UserHierarchy.findAll({
          where: {
            parentUserId: { [Op.in]: parentIds },
            isActive: true,
            effectiveFrom: { [Op.lte]: new Date() },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: new Date() } }
            ]
          },
          attributes: ['userId']
        });

        const subordinateIds = subordinates.map(sub => sub.userId);
        if (subordinateIds.length > 0) {
          const nestedSubordinates = await getAllSubordinates(subordinateIds);
          return [...subordinateIds, ...nestedSubordinates];
        }
        return subordinateIds;
      };

      const allSubordinates = await getAllSubordinates(teamMemberIds);
      teamMemberIds = [...teamMemberIds, ...allSubordinates];
    }

    if (teamMemberIds.length === 0) {
      return res.json({
        success: true,
        data: {
          manager: {
            id: manager.id,
            firstName: manager.firstName,
            lastName: manager.lastName,
            email: manager.email,
            designation: manager.designation
          },
          teamMembers: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    }

    // Build search filter
    const searchFilter = search ? {
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeId: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows: teamMembers } = await User.findAndCountAll({
      where: {
        id: { [Op.in]: teamMemberIds },
        isActive: true,
        ...searchFilter
      },
      include: [
        {
          model: RoleMaster,
          as: 'roleMaster',
          attributes: ['id', 'roleCode', 'roleName', 'level']
        },
        {
          model: UserHierarchy,
          as: 'hierarchyAsUser',
          where: {
            isActive: true,
            effectiveFrom: { [Op.lte]: new Date() },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: new Date() } }
            ]
          },
          required: false,
          attributes: ['hierarchyLevel', 'relationshipType', 'effectiveFrom']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    res.json({
      success: true,
      data: {
        manager: {
          id: manager.id,
          firstName: manager.firstName,
          lastName: manager.lastName,
          email: manager.email,
          designation: manager.designation
        },
        teamMembers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get team members by manager ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team members'
    });
  }
};

// Get team members for the currently logged-in manager/account manager
const getTeamMembers = async (req, res) => {
  try {
    const { userId } = req.user; // Get from auth middleware
    const {
      includeSubordinates = false,
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'firstName',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get direct reports
    let teamMemberIds = [];
    
    const directReports = await UserHierarchy.findAll({
      where: {
        parentUserId: userId,
        isActive: true,
        effectiveFrom: { [Op.lte]: new Date() },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: new Date() } }
        ]
      },
      attributes: ['userId']
    });

    teamMemberIds = directReports.map(report => report.userId);

    // If includeSubordinates is true, get all subordinates recursively
    if (includeSubordinates === 'true') {
      const getAllSubordinates = async (parentIds) => {
        if (parentIds.length === 0) return [];
        
        const subordinates = await UserHierarchy.findAll({
          where: {
            parentUserId: { [Op.in]: parentIds },
            isActive: true,
            effectiveFrom: { [Op.lte]: new Date() },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: new Date() } }
            ]
          },
          attributes: ['userId']
        });

        const subordinateIds = subordinates.map(sub => sub.userId);
        if (subordinateIds.length > 0) {
          const nestedSubordinates = await getAllSubordinates(subordinateIds);
          return [...subordinateIds, ...nestedSubordinates];
        }
        return subordinateIds;
      };

      const allSubordinates = await getAllSubordinates(teamMemberIds);
      teamMemberIds = [...teamMemberIds, ...allSubordinates];
    }

    if (teamMemberIds.length === 0) {
      return res.json({
        success: true,
        data: {
          teamMembers: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    }

    // Build search filter
    const searchFilter = search ? {
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeId: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows: teamMembers } = await User.findAndCountAll({
      where: {
        id: { [Op.in]: teamMemberIds },
        isActive: true,
        ...searchFilter
      },
      include: [
        {
          model: RoleMaster,
          as: 'roleMaster',
          attributes: ['id', 'roleCode', 'roleName', 'level']
        },
        {
          model: UserHierarchy,
          as: 'hierarchyAsUser',
          where: {
            isActive: true,
            effectiveFrom: { [Op.lte]: new Date() },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: new Date() } }
            ]
          },
          required: false,
          attributes: ['hierarchyLevel', 'relationshipType', 'effectiveFrom']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    res.json({
      success: true,
      data: {
        teamMembers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team members'
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      password,
      department,
      designation,
      dateOfJoining,
      roleId,
      parentUserId,
      hierarchyLevel
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { employeeId }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or employee ID already exists'
      });
    }

    // Validate role exists
    if (roleId) {
      const roleExists = await RoleMaster.findByPk(roleId);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID'
        });
      }
    }

    // Create user
    const user = await User.create({
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      passwordHash: password, // Will be hashed by the model hook
      department,
      designation,
      dateOfJoining,
      roleId
    });

    // Create hierarchy relationship if parentUserId is provided
    if (parentUserId) {
      await UserHierarchy.create({
        userId: user.id,
        parentUserId,
        hierarchyLevel: hierarchyLevel || 2,
        relationshipType: 'direct_report',
        createdBy: req.user.userId
      });
    }

    // Fetch user with role information
    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: RoleMaster,
          as: 'roleMaster',
          attributes: ['id', 'roleCode', 'roleName', 'level']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: createdUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user creation'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      dateOfJoining,
      roleId,
      isActive
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Validate role exists if roleId is provided
    if (roleId) {
      const roleExists = await RoleMaster.findByPk(roleId);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID'
        });
      }
    }

    // Update user
    await user.update({
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      dateOfJoining,
      roleId,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    // Fetch updated user with role information
    const updatedUser = await User.findByPk(userId, {
      include: [
        {
          model: RoleMaster,
          as: 'roleMaster',
          attributes: ['id', 'roleCode', 'roleName', 'level']
        }
      ]
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user update'
    });
  }
};

// Deactivate user (soft delete)
const deactivateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ isActive: false });

    // Also deactivate hierarchy relationships
    await UserHierarchy.update(
      { isActive: false },
      {
        where: {
          [Op.or]: [
            { userId },
            { parentUserId: userId }
          ]
        }
      }
    );

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user deactivation'
    });
  }
};

// Get current user's complete profile information
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.user; // Get from auth middleware

    const user = await User.findByPk(userId, {
      include: [
        {
          model: RoleMaster,
          as: 'roleMaster',
          attributes: ['id', 'roleCode', 'roleName', 'description', 'level']
        },
        {
          model: UserHierarchy,
          as: 'hierarchyAsUser',
          where: {
            isActive: true,
            effectiveFrom: { [Op.lte]: new Date() },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: new Date() } }
            ]
          },
          required: false,
          include: [
            {
              model: User,
              as: 'parentUser',
              attributes: ['id', 'firstName', 'lastName', 'email', 'designation', 'department']
            }
          ],
          attributes: ['hierarchyLevel', 'relationshipType', 'effectiveFrom', 'effectiveTo']
        },
        {
          model: UserHierarchy,
          as: 'hierarchyAsParent',
          where: {
            isActive: true,
            effectiveFrom: { [Op.lte]: new Date() },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: new Date() } }
            ]
          },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email', 'designation', 'department']
            }
          ],
          attributes: ['hierarchyLevel', 'relationshipType', 'effectiveFrom']
        },
        {
          model: Client,
          as: 'managedClients',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'clientName', 'email', 'status', 'industry']
        },
        {
          model: Project,
          as: 'managedProjects',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'projectName', 'status', 'startDate', 'endDate', 'budgetAmount', 'description']
        }
      ],
      attributes: {
        exclude: ['passwordHash', 'resetPasswordToken', 'resetPasswordExpires']
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Get additional profile statistics
    const profileStats = {
      // Team size (direct reports)
      directReports: await UserHierarchy.count({
        where: {
          parentUserId: userId,
          isActive: true,
          effectiveFrom: { [Op.lte]: new Date() },
          [Op.or]: [
            { effectiveTo: null },
            { effectiveTo: { [Op.gte]: new Date() } }
          ]
        }
      }),
      
      // Total managed clients
      managedClientsCount: await Client.count({
        where: {
          accountManagerId: userId,
          isActive: true
        }
      }),
      
      // Total managed projects
      managedProjectsCount: await Project.count({
        where: {
          projectManagerId: userId,
          isActive: true
        }
      }),
      
      // Years of service
      yearsOfService: user.dateOfJoining ? 
        Math.floor((new Date() - new Date(user.dateOfJoining)) / (1000 * 60 * 60 * 24 * 365.25)) : 0
    };

    // Format the response with organized profile data
    const profileData = {
      // Basic Information
      basicInfo: {
        id: user.id,
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture
      },
      
      // Professional Information
      professionalInfo: {
        department: user.department,
        designation: user.designation,
        dateOfJoining: user.dateOfJoining,
        role: user.role,
        roleDetails: user.roleMaster,
        isActive: user.isActive,
        yearsOfService: profileStats.yearsOfService
      },
      
      // Hierarchy Information
      hierarchyInfo: {
        manager: user.hierarchyAsUser?.[0] ? {
          hierarchyLevel: user.hierarchyAsUser[0].hierarchyLevel,
          relationshipType: user.hierarchyAsUser[0].relationshipType,
          managerDetails: user.hierarchyAsUser[0].parentUser,
          effectiveFrom: user.hierarchyAsUser[0].effectiveFrom
        } : null,
        
        directReports: user.hierarchyAsParent?.map(hierarchy => ({
          userId: hierarchy.user.id,
          name: `${hierarchy.user.firstName} ${hierarchy.user.lastName}`,
          email: hierarchy.user.email,
          designation: hierarchy.user.designation,
          department: hierarchy.user.department,
          hierarchyLevel: hierarchy.hierarchyLevel,
          relationshipType: hierarchy.relationshipType,
          effectiveFrom: hierarchy.effectiveFrom
        })) || []
      },
      
      // Management Information
      managementInfo: {
        managedClients: user.managedClients || [],
        managedProjects: user.managedProjects || []
      },
      
      // Statistics
      statistics: profileStats,
      
      // Account Information
      accountInfo: {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLoginAt || null // If you have this field
      }
    };

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profileData
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
};

// Get user statistics and dashboard data
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.user;

    // Get total users count
    const totalUsers = await User.count({
      where: { isActive: true }
    });

    // Get users by department
    const usersByDepartment = await User.findAll({
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['department'],
      raw: true
    });

    // Get team size for current user (if they are a manager)
    const teamSize = await UserHierarchy.count({
      where: {
        parentUserId: userId,
        isActive: true,
        effectiveFrom: { [Op.lte]: new Date() },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: new Date() } }
        ]
      }
    });

    // Get recent hires (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentHires = await User.count({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo },
        isActive: true
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        usersByDepartment,
        teamSize,
        recentHires
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
};

// Assign/Update user hierarchy
const updateUserHierarchy = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { parentUserId, hierarchyLevel, relationshipType } = req.body;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if parent user exists
    if (parentUserId) {
      const parentUser = await User.findByPk(parentUserId);
      if (!parentUser) {
        return res.status(404).json({
          success: false,
          message: 'Parent user not found'
        });
      }
    }

    // Deactivate existing hierarchy
    await UserHierarchy.update(
      { isActive: false, effectiveTo: new Date() },
      { where: { userId, isActive: true } }
    );

    // Create new hierarchy if parentUserId is provided
    if (parentUserId) {
      await UserHierarchy.create({
        userId,
        parentUserId,
        hierarchyLevel: hierarchyLevel || 2,
        relationshipType: relationshipType || 'direct_report',
        createdBy: req.user.userId
      });
    }

    res.json({
      success: true,
      message: 'User hierarchy updated successfully'
    });
  } catch (error) {
    console.error('Update user hierarchy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during hierarchy update'
    });
  }
};

// Validation rules
const createUserValidation = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Employee ID must be between 3 and 50 characters'),
  
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfJoining')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of joining'),

  body('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),

  body('parentUserId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent User ID must be a positive integer')
];

const updateUserValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfJoining')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of joining'),

  body('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

const userIdValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const hierarchyValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),

  body('parentUserId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent User ID must be a positive integer'),

  body('hierarchyLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Hierarchy level must be between 1 and 10'),

  body('relationshipType')
    .optional()
    .isIn(['direct_report', 'indirect_report', 'matrix_report'])
    .withMessage('Invalid relationship type')
];

module.exports = {
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
};
