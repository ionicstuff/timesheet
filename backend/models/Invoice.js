const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id'
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'invoice_number'
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('generated', 'approved', 'sent'),
    allowNull: false,
    defaultValue: 'generated'
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'issue_date'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'due_date'
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pdfPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'pdf_path'
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by_user_id'
  },
  approvedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'approved_by_user_id'
  },
  sentByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sent_by_user_id'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at'
  }
}, {
  tableName: 'invoices',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Invoice;
