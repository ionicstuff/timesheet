const { Client, Project, User, Spoc } = require('../models');
const { Op } = require('sequelize');

const clientController = {
  // Get all clients (for users with appropriate roles)
  getClients: async (req, res) => {
    try {
      const clients = await Client.findAll({
        include: [
          {
            model: User,
            as: 'accountManager',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Project,
            as: 'projects',
            where: { isActive: true },
            required: false,
            attributes: ['id', 'projectName', 'status', 'startDate', 'endDate']
          }
        ],
        order: [['clientName', 'ASC']]
      });

      // Transform data to match expected format
      const transformedClients = clients.map(client => ({
        id: client.id,
        name: client.clientName,
        description: client.companyName,
        contactEmail: client.email,
        contactPhone: client.phone,
        address: client.address,
        isActive: client.isActive,
        createdAt: client.createdAt
      }));

      res.json(transformedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ message: 'Error fetching clients', error: error.message });
    }
  },

  // Get a single client
  getClient: async (req, res) => {
    try {
      const { id } = req.params;
      
      const client = await Client.findByPk(id, {
        include: [
          {
            model: User,
            as: 'accountManager',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Project,
            as: 'projects',
            where: { isActive: true },
            required: false,
            attributes: ['id', 'projectName', 'status', 'startDate', 'endDate']
          },
          {
            model: Spoc,
            as: 'spocs',
            attributes: ['id', 'name', 'email', 'phone'],
            where: { isActive: true },
            required: false
          }
        ]
      });

      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const transformedClient = {
        id: client.id,
        name: client.clientName,
        description: client.companyName,
        contactEmail: client.email,
        contactPhone: client.phone,
        address: client.address,
        isActive: client.isActive,
        createdAt: client.createdAt
      };

      res.json(transformedClient);
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({ message: 'Error fetching client', error: error.message });
    }
  },

  // Update a client
  updateClient: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const [updatedRowsCount] = await Client.update(updateData, {
        where: { id }
      });

      if (updatedRowsCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Fetch the updated client with associations
      const updatedClient = await Client.findByPk(id, {
        include: [
          {
            model: User,
            as: 'accountManager',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Project,
            as: 'projects',
            where: { isActive: true },
            required: false,
            attributes: ['id', 'projectName', 'status', 'startDate', 'endDate']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedClient,
        message: 'Client updated successfully'
      });
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating client',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Delete a client
  deleteClient: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if client has projects
      const projectCount = await Project.count({ where: { clientId: id } });
      
      if (projectCount > 0) {
        return res.status(400).json({ 
          message: `Cannot delete client. ${projectCount} projects are associated with this client.` 
        });
      }

      const deletedRowsCount = await Client.destroy({ where: { id } });

      if (deletedRowsCount === 0) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.json({ message: 'Client deleted successfully' });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ message: 'Error deleting client', error: error.message });
    }
  },

  // Get clients that the current user has worked with
  getUserClients: async (req, res) => {
    try {
      const userId = req.user.id;
      const { search, industry, status } = req.query;

      // Base where conditions for user access
      const baseWhere = {
        [Op.or]: [
          { accountManagerId: userId },
          { createdBy: userId },
          {
            id: {
              [Op.in]: await Project.findAll({
                where: {
                  [Op.or]: [
                    { projectManagerId: userId },
                    // Add timesheet associations here when available
                  ]
                },
                attributes: ['clientId'],
                raw: true
              }).then(projects => projects.map(p => p.clientId))
            }
          }
        ],
        isActive: true
      };

      // Add search filter
      if (search) {
        baseWhere[Op.and] = baseWhere[Op.and] || [];
        baseWhere[Op.and].push({
          [Op.or]: [
            { clientName: { [Op.iLike]: `%${search}%` } },
            { companyName: { [Op.iLike]: `%${search}%` } },
            { clientCode: { [Op.iLike]: `%${search}%` } }
          ]
        });
      }

      // Add industry filter
      if (industry) {
        baseWhere[Op.and] = baseWhere[Op.and] || [];
        baseWhere[Op.and].push({ industry });
      }

      // Add status filter
      if (status) {
        baseWhere[Op.and] = baseWhere[Op.and] || [];
        baseWhere[Op.and].push({ status });
      }

      // Get clients with filters applied
      const clients = await Client.findAll({
        where: baseWhere,
        include: [
          {
            model: User,
            as: 'accountManager',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Project,
            as: 'projects',
            where: { isActive: true },
            required: false,
            attributes: ['id', 'projectName', 'status', 'startDate', 'endDate']
          }
        ],
        order: [['clientName', 'ASC']]
      });

      res.json({
        success: true,
        data: clients,
        message: 'Clients retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching user clients:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching clients',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  getIndustries: async (req, res) => {
    try {
      const industries = await Client.findAll({
        attributes: [[Client.sequelize.fn('DISTINCT', Client.sequelize.col('industry')), 'industry']],
        where: {
          industry: {
            [Op.ne]: null,
            [Op.ne]: ''
          }
        },
        order: [['industry', 'ASC']]
      });

      res.json({
        success: true,
        data: industries.map(item => item.industry),
        message: 'Industries retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching industries:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching industries'
      });
    }
  },
  createClient: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        clientCode,
        clientName,
        companyName,
        email,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        website,
        industry,
        contractStartDate,
        contractEndDate,
        status,
        billingType,
        hourlyRate,
        currency,
        notes,
        spocEmail // Added SPOC email field
      } = req.body;

      // Validate required fields
      if (!clientName) {
        return res.status(400).json({
          success: false,
          message: 'Client name is required'
        });
      }

      // Check if client code already exists (only if provided)
      if (clientCode) {
        const existingClient = await Client.findOne({
          where: { clientCode }
        });

        if (existingClient) {
          return res.status(400).json({
            success: false,
            message: 'Client code already exists'
          });
        }
      }

      // Generate client code if not provided
      let finalClientCode = clientCode;
      if (!finalClientCode) {
        const clientCount = await Client.count();
        finalClientCode = `CL${String(clientCount + 1).padStart(4, '0')}`;
      }

      // Create the client
      const newClient = await Client.create({
        clientCode: finalClientCode,
        clientName,
        companyName,
        email,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        website,
        industry,
        contractStartDate,
        contractEndDate,
        status: status || 'active',
        billingType,
        hourlyRate,
        currency: currency || 'USD',
        notes,
        createdBy: userId
      });

      // Create SPOC if email is provided
      if (spocEmail) {
        try {
          // Extract name from email if no name provided
          const spocName = spocEmail.split('@')[0]; // Use email prefix as default name
          
          await Spoc.create({
            clientId: newClient.id,
            name: spocName,
            email: spocEmail,
            isPrimary: true, // Assuming primary SPOC
            isActive: true,
            createdBy: userId
          });
        } catch (error) {
          console.error('Error creating SPOC:', error);
          // Don't fail the entire client creation if SPOC creation fails
        }
      }

      // Fetch the created client with associations
      const clientWithDetails = await Client.findByPk(newClient.id, {
        include: [
          {
            model: User,
            as: 'accountManager',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Spoc,
            as: 'spocs',
            attributes: ['id', 'name', 'email'],
            where: { isActive: true },
            required: false
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: clientWithDetails,
        message: 'Client created and SPOC added successfully'
      });
    } catch (error) {
      console.error('Error creating client:', error);
      
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

      // Handle unique constraint errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Client code already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating client',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Get all clients (for dropdowns, etc.)
  getAllClients: async (req, res) => {
    try {
      const clients = await Client.findAll({
        where: { isActive: true },
        include: [
          {
            model: Spoc,
            as: 'spocs',
            attributes: ['id', 'name', 'email'],
            where: { isActive: true },
            required: false
          }
        ],
        attributes: ['id', 'clientCode', 'clientName', 'companyName', 'status'],
        order: [['clientName', 'ASC']]
      });

      res.json({
        success: true,
        data: clients,
        message: 'All clients retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching all clients:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching clients',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },
  // Get client by ID
  getClientById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const client = await Client.findByPk(id, {
        include: [
          {
            model: User,
            as: 'accountManager',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Project,
            as: 'projects',
            where: { isActive: true },
            required: false,
            attributes: ['id', 'projectName', 'status', 'startDate', 'endDate', 'projectManagerId'],
            include: [
              {
                model: User,
                as: 'projectManager',
                attributes: ['id', 'firstName', 'lastName', 'email']
              }
            ]
          }
        ]
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      res.json({
        success: true,
        data: client,
        message: 'Client retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching client',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

module.exports = clientController;
