const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  },
  type: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  actorUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'actor_user_id'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  underscored: true,
  timestamps: false
});

module.exports = Notification;
