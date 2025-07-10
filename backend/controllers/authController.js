const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Register user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
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
      dateOfJoining
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { employeeId }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or employee ID already exists'
      });
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
      dateOfJoining
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      message: 'Server error during registration'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login'
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// Validate token
const validateToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (middleware passed)
    res.json({
      valid: true,
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({
      message: 'Server error during token validation'
    });
  }
};

// Validation rules
const registerValidation = [
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
    .withMessage('Please provide a valid date of joining')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = {
  register,
  login,
  getCurrentUser,
  validateToken,
  registerValidation,
  loginValidation
};
