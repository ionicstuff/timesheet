const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceRevision = sequelize.define('InvoiceRevision', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'invoice_id'
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pdfPath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'pdf_path'
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by_user_id'
  }
}, {
  tableName: 'invoice_revisions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = InvoiceRevision;
