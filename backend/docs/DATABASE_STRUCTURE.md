# Enhanced Database Structure for Timesheet Application

## Overview

This document describes the enhanced database structure that supports a comprehensive company hierarchy, role-based permissions, client/project management, and detailed access control.

## Database Tables

### Core Tables

#### 1. Users (Enhanced)
- **Purpose**: Store user account information
- **New Fields**: `role_id` - Links to RoleMaster for detailed role management
- **Key Features**: 
  - Maintains backward compatibility with existing `role` ENUM
  - Links to RoleMaster for enhanced role capabilities

#### 2. Role Masters
- **Purpose**: Define detailed company roles and hierarchy levels
- **Table**: `role_masters`
- **Key Fields**:
  - `role_code` - Unique identifier (DIR, ACM, PM, TL, SD, DEV, JD, HR, ADM)
  - `role_name` - Human-readable role name
  - `level` - Hierarchy level (1=highest, 10=lowest)
  - `can_manage_users`, `can_manage_projects`, `can_view_reports` - Role capabilities

#### 3. Module Masters
- **Purpose**: Define application modules and features
- **Table**: `module_masters`
- **Key Fields**:
  - `module_code` - Unique identifier
  - `module_name` - Human-readable name
  - `route` - Frontend route path
  - `parent_module_id` - Self-referencing for sub-modules
  - `sort_order` - Display order

#### 4. Permission Masters
- **Purpose**: Define granular permissions for CRUD operations
- **Table**: `permission_masters`
- **Key Fields**:
  - `permission_code` - Unique identifier
  - `module_id` - Links to module
  - `action` - CRUD operation (create, read, update, delete, import, export, approve)
  - `resource` - Resource type (timesheet, user, project, etc.)

#### 5. Role Permissions
- **Purpose**: Many-to-many mapping between roles and permissions
- **Table**: `role_permissions`
- **Key Fields**:
  - `role_id`, `permission_id` - Links roles to permissions
  - `is_granted` - Permission status
  - `granted_by`, `granted_at`, `expires_at` - Audit trail

#### 6. User Hierarchies
- **Purpose**: Define organizational reporting structure
- **Table**: `user_hierarchies`
- **Key Fields**:
  - `user_id`, `parent_user_id` - Defines reporting relationships
  - `hierarchy_level` - Level in organization
  - `relationship_type` - Type of reporting (direct, indirect, matrix)
  - `effective_from`, `effective_to` - Time-bound relationships

#### 7. Clients
- **Purpose**: Manage client information and relationships
- **Table**: `clients`
- **Key Fields**:
  - `client_code` - Unique identifier
  - `account_manager_id` - Links to user managing this client
  - `contract_start_date`, `contract_end_date` - Contract periods
  - `billing_type`, `hourly_rate` - Billing information

#### 8. Projects
- **Purpose**: Manage client projects and assignments
- **Table**: `projects`
- **Key Fields**:
  - `project_code` - Unique identifier
  - `client_id` - Links to client
  - `project_manager_id` - Links to managing user
  - `estimated_hours`, `actual_hours` - Time tracking
  - `budget_amount`, `spent_amount` - Financial tracking
  - `tags` - Array of project tags for categorization

## Company Hierarchy Structure

### Role Hierarchy (by level)
1. **Director (DIR)** - Level 1
   - Overall business direction and strategy
   - Full user and project management rights
   - All reports access

2. **Account Manager (ACM)** - Level 2
   - Manages client relationships
   - Oversees multiple projects
   - User and project management rights

3. **Project Manager (PM)** - Level 3
   - Manages specific projects
   - Coordinates team activities
   - Project management and reports access

4. **HR Manager (HR)** - Level 3
   - Employee affairs management
   - User management rights
   - Reports access

5. **Team Lead (TL)** - Level 4
   - Leads development teams
   - Day-to-day team management
   - Reports access only

6. **Senior Developer (SD)** - Level 5
   - Experienced developer with mentoring duties
   - Basic access

7. **Developer (DEV)** - Level 6
   - Software development and implementation
   - Basic access

8. **Junior Developer (JD)** - Level 7
   - Entry-level development
   - Basic access

9. **System Admin (ADM)** - Level 1
   - Full system access
   - All management rights

## Key Relationships

### User Management Hierarchy
```
Director
├── Account Manager
│   ├── Project Manager
│   │   ├── Team Lead
│   │   │   ├── Senior Developer
│   │   │   ├── Developer
│   │   │   └── Junior Developer
│   │   └── HR Manager (Matrix reporting)
│   └── System Admin (Direct to Director)
```

### Project Structure
```
Client
├── Project 1 (Managed by Project Manager)
├── Project 2 (Managed by Project Manager)
└── Project 3 (Managed by Account Manager)
```

## Permission System

### Module-Based Permissions
- **Dashboard**: View access based on role
- **Time Tracking**: Clock in/out, timesheet management
- **User Management**: Create, read, update, delete users
- **Project Management**: Project CRUD operations
- **Client Management**: Client relationship management
- **Reports**: Various analytics and reports
- **Administration**: System settings and role management

### CRUD Operations
Each module supports granular permissions:
- **Create**: Add new records
- **Read**: View existing records
- **Update**: Modify existing records
- **Delete**: Remove records
- **Import**: Bulk data import
- **Export**: Data export functionality
- **Approve**: Approval workflows

## Migration and Setup

### Running Migrations
```bash
node backend/scripts/runMigrations.js
```

This will:
1. Create all new tables with proper indexes
2. Add foreign key constraints
3. Populate initial data (roles, modules, permissions)
4. Set up the complete hierarchy structure

### Initial Data
The system comes pre-populated with:
- 9 company roles with appropriate levels and permissions
- 11 application modules (7 main + 4 sub-modules)
- Basic permission structure for common operations

## Benefits

### Enhanced Security
- Granular permission control at module and action level
- Role-based access with inheritance
- Time-bound permissions with expiration

### Organizational Structure
- Clear hierarchy representation
- Multiple reporting relationships (direct, indirect, matrix)
- Historical tracking of organizational changes

### Client/Project Management
- Dedicated client relationship management
- Project tracking with budget and time controls
- Flexible team assignments

### Scalability
- Modular permission system
- Easy addition of new roles and modules
- Support for complex organizational structures

## Usage Examples

### Checking User Permissions
```javascript
// Get user with role and permissions
const user = await User.findByPk(userId, {
  include: [{
    model: RoleMaster,
    as: 'roleMaster',
    include: [{
      model: PermissionMaster,
      as: 'permissions',
      through: { attributes: ['isGranted'] }
    }]
  }]
});
```

### Getting User Hierarchy
```javascript
// Get direct reports
const directReports = await UserHierarchy.findAll({
  where: { parentUserId: managerId, isActive: true },
  include: [{ model: User, as: 'user' }]
});
```

### Project Assignment
```javascript
// Get projects managed by user
const projects = await Project.findAll({
  where: { projectManagerId: userId },
  include: [
    { model: Client, as: 'client' },
    { model: User, as: 'projectManager' }
  ]
});
```

This enhanced structure provides a solid foundation for enterprise-level timesheet management with comprehensive role-based access control and organizational hierarchy support.
