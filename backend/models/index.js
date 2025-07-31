const User = require('./User');
const Timesheet = require('./Timesheet');
const RoleMaster = require('./RoleMaster');
const ModuleMaster = require('./ModuleMaster');
const PermissionMaster = require('./PermissionMaster');
const RolePermission = require('./RolePermission');
const UserHierarchy = require('./UserHierarchy');
const Client = require('./Client');
const Project = require('./Project');
const Spoc = require('./Spoc');
const Task = require('./Task');

// User and RoleMaster associations
User.belongsTo(RoleMaster, {
  foreignKey: 'roleId',
  as: 'roleMaster'
});

RoleMaster.hasMany(User, {
  foreignKey: 'roleId',
  as: 'users'
});

// ModuleMaster and PermissionMaster associations
PermissionMaster.belongsTo(ModuleMaster, {
  foreignKey: 'moduleId',
  as: 'module'
});

ModuleMaster.hasMany(PermissionMaster, {
  foreignKey: 'moduleId',
  as: 'permissions'
});

// RoleMaster and PermissionMaster many-to-many through RolePermission
RoleMaster.belongsToMany(PermissionMaster, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});

PermissionMaster.belongsToMany(RoleMaster, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

// RolePermission associations
RolePermission.belongsTo(RoleMaster, {
  foreignKey: 'roleId',
  as: 'role'
});

RolePermission.belongsTo(PermissionMaster, {
  foreignKey: 'permissionId',
  as: 'permission'
});

RolePermission.belongsTo(User, {
  foreignKey: 'grantedBy',
  as: 'grantedByUser'
});

// UserHierarchy associations
UserHierarchy.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

UserHierarchy.belongsTo(User, {
  foreignKey: 'parentUserId',
  as: 'parentUser'
});

UserHierarchy.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

User.hasMany(UserHierarchy, {
  foreignKey: 'userId',
  as: 'hierarchyAsUser'
});

User.hasMany(UserHierarchy, {
  foreignKey: 'parentUserId',
  as: 'hierarchyAsParent'
});

// Client associations
Client.belongsTo(User, {
  foreignKey: 'accountManagerId',
  as: 'accountManager'
});

Client.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

User.hasMany(Client, {
  foreignKey: 'accountManagerId',
  as: 'managedClients'
});

// Project associations
Project.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client'
});

Project.belongsTo(User, {
  foreignKey: 'projectManagerId',
  as: 'projectManager'
});

Project.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

Client.hasMany(Project, {
  foreignKey: 'clientId',
  as: 'projects'
});

User.hasMany(Project, {
  foreignKey: 'projectManagerId',
  as: 'managedProjects'
});

// Project SPOC association
Project.belongsTo(Spoc, {
  foreignKey: 'spocId',
  as: 'spoc'
});

// SPOC associations
Spoc.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client'
});

Spoc.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

Spoc.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

Client.hasMany(Spoc, {
  foreignKey: 'clientId',
  as: 'spocs'
});

Project.hasMany(Spoc, {
  foreignKey: 'projectId',
  as: 'spocs'
});

User.hasMany(Spoc, {
  foreignKey: 'createdBy',
  as: 'createdSpocs'
});

// Task associations
Task.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

Task.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee'
});

Project.hasMany(Task, {
  foreignKey: 'projectId',
  as: 'tasks'
});

User.hasMany(Task, {
  foreignKey: 'assignedTo',
  as: 'assignedTasks'
});

// Existing User and Timesheet associations
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
  Timesheet,
  RoleMaster,
  ModuleMaster,
  PermissionMaster,
  RolePermission,
  UserHierarchy,
  Client,
  Project,
  Spoc,
  Task
};
