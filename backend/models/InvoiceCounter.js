const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceCounter = sequelize.define('InvoiceCounter', {
  year: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  lastSeq: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'last_seq'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at'
  }
}, {
  tableName: 'invoice_counters',
  underscored: true,
  timestamps: false
});

module.exports = InvoiceCounter;
