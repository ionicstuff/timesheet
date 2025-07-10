const User = require('./User');
const Timesheet = require('./Timesheet');

// Define associations
User.hasMany(Timesheet, {
  foreignKey: 'userId',
  as: 'timesheets'
});

Timesheet.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  User,
  Timesheet
};
