const { Spoc, Client, User } = require('../models');
const { Op } = require('sequelize');

const spocController = {
  // Get SPOCs by client ID
  getSpocsByClient: async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const spocs = await Spoc.findAll({
        where: { 
          clientId: clientId,
          isActive: true 
        },
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'clientName', 'clientCode']
          }
        ],
        attributes: ['id', 'name', 'email', 'phone', 'designation', 'department', 'isPrimary'],
        order: [['isPrimary', 'DESC'], ['name', 'ASC']]
      });

      res.json({
        success: true,
        data: spocs,
        message: 'SPOCs retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching SPOCs by client:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching SPOCs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Get all SPOCs
  getAllSpocs: async (req, res) => {
    try {
      const spocs = await Spoc.findAll({
        where: { isActive: true },
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'clientName', 'clientCode']
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: spocs,
        message: 'All SPOCs retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching all SPOCs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching SPOCs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Create a new SPOC
  createSpoc: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        name,
        email,
        phone,
        designation,
        department,
        clientId,
        projectId,
        isPrimary,
        notes
      } = req.body;

      // Validate required fields
      if (!name || !email || !clientId) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and client are required'
        });
      }

      // Check if SPOC with same email already exists for this client
      const existingSpoc = await Spoc.findOne({
        where: {
          email,
          clientId,
          isActive: true
        }
      });

      if (existingSpoc) {
        return res.status(400).json({
          success: false,
          message: 'SPOC with this email already exists for this client'
        });
      }

      // Create the SPOC
      const newSpoc = await Spoc.create({
        name,
        email,
        phone,
        designation,
        department,
        clientId,
        projectId: projectId || null,
        isPrimary: isPrimary || false,
        notes,
        createdBy: userId
      });

      // Fetch the created SPOC with associations
      const spocWithDetails = await Spoc.findByPk(newSpoc.id, {
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'clientName', 'clientCode']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: spocWithDetails,
        message: 'SPOC created successfully'
      });
    } catch (error) {
      console.error('Error creating SPOC:', error);
      
      // Handle validation errors
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating SPOC',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Update a SPOC
  updateSpoc: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const [updatedRowsCount] = await Spoc.update(updateData, {
        where: { id }
      });

      if (updatedRowsCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'SPOC not found'
        });
      }

      res.json({
        success: true,
        message: 'SPOC updated successfully'
      });
    } catch (error) {
      console.error('Error updating SPOC:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating SPOC',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Delete/Deactivate a SPOC
  deleteSpoc: async (req, res) => {
    try {
      const { id } = req.params;

      // Instead of hard delete, we'll soft delete by setting isActive to false
      const [updatedRowsCount] = await Spoc.update(
        { isActive: false },
        { where: { id } }
      );

      if (updatedRowsCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'SPOC not found'
        });
      }

      res.json({
        success: true,
        message: 'SPOC deactivated successfully'
      });
    } catch (error) {
      console.error('Error deleting SPOC:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting SPOC',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

module.exports = spocController;
