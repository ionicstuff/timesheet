const {
  User,
  Timesheet,
  RoleMaster,
  ModuleMaster,
  PermissionMaster,
  RolePermission,
  UserHierarchy,
  Client,
  Project
} = require('./index');

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

// Existing User and Timesheet associations (keeping these)
User.hasMany(Timesheet, {
  foreignKey: 'userId',
  as: 'timesheets'
});

Timesheet.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  // Export function to set up all associations
  setupAssociations: () => {
    console.log('Database associations have been set up successfully');
  }
};
