# User Management API Documentation

This document describes the User Management API endpoints for team management, user CRUD operations, and organizational hierarchy management.

## Base URL
```
http://localhost:5000/api/users
```

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Users
**GET** `/api/users`

Retrieve all users with filtering, pagination, and sorting capabilities.

**Access:** Admin, HR, Manager

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `search` (string, optional): Search in name, email, or employee ID
- `department` (string, optional): Filter by department
- `role` (string, optional): Filter by role
- `isActive` (boolean, optional): Filter by active status
- `sortBy` (string, optional): Sort field (default: "firstName")
- `sortOrder` (string, optional): "ASC" or "DESC" (default: "ASC")

**Example Request:**
```bash
GET /api/users?page=1&limit=10&search=john&department=Engineering&sortBy=firstName&sortOrder=ASC
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "employeeId": "EMP001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "department": "Engineering",
        "designation": "Software Engineer",
        "isActive": true,
        "roleMaster": {
          "id": 1,
          "roleCode": "DEV",
          "roleName": "Developer",
          "level": 6
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 45,
      "itemsPerPage": 10
    }
  }
}
```

### 2. Get User Statistics
**GET** `/api/users/stats`

Get user statistics and dashboard data.

**Access:** Admin, HR, Manager

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 45,
    "usersByDepartment": [
      { "department": "Engineering", "count": 20 },
      { "department": "Marketing", "count": 10 },
      { "department": "HR", "count": 5 }
    ],
    "teamSize": 8,
    "recentHires": 3
  }
}
```

### 3. Get Team Members
**GET** `/api/users/team`

Get team members for the authenticated user (manager/account manager).

**Access:** Any authenticated user

**Query Parameters:**
- `includeSubordinates` (boolean, optional): Include all subordinates recursively
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `search` (string, optional): Search in team member details
- `sortBy` (string, optional): Sort field (default: "firstName")
- `sortOrder` (string, optional): "ASC" or "DESC" (default: "ASC")

**Example Request:**
```bash
GET /api/users/team?includeSubordinates=true&page=1&limit=20
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "teamMembers": [
      {
        "id": 2,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com",
        "designation": "Senior Developer",
        "roleMaster": {
          "roleCode": "SD",
          "roleName": "Senior Developer"
        },
        "hierarchyAsUser": [
          {
            "hierarchyLevel": 2,
            "relationshipType": "direct_report"
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 8,
      "itemsPerPage": 20
    }
  }
}
```

### 4. Get User by ID
**GET** `/api/users/:userId`

Get detailed information about a specific user.

**Access:** Admin, HR, Manager, or own profile

**Path Parameters:**
- `userId` (number): User ID

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employeeId": "EMP001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "roleMaster": {
      "roleCode": "ACM",
      "roleName": "Account Manager"
    },
    "hierarchyAsUser": [
      {
        "parentUser": {
          "id": 5,
          "firstName": "Manager",
          "lastName": "Name"
        }
      }
    ],
    "hierarchyAsParent": [
      {
        "user": {
          "id": 10,
          "firstName": "Team",
          "lastName": "Member"
        }
      }
    ],
    "managedClients": [
      {
        "id": 1,
        "clientName": "Acme Corp",
        "status": "active"
      }
    ],
    "managedProjects": [
      {
        "id": 1,
        "projectName": "Website Redesign",
        "status": "in_progress"
      }
    ]
  }
}
```

### 5. Create User
**POST** `/api/users`

Create a new user.

**Access:** Admin, HR

**Request Body:**
```json
{
  "employeeId": "EMP002",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+1234567891",
  "password": "SecurePass123",
  "department": "Engineering",
  "designation": "Senior Developer",
  "dateOfJoining": "2024-02-01",
  "roleId": 2,
  "parentUserId": 5,
  "hierarchyLevel": 2
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 15,
    "employeeId": "EMP002",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "roleMaster": {
      "roleCode": "SD",
      "roleName": "Senior Developer"
    }
  }
}
```

### 6. Update User
**PUT** `/api/users/:userId`

Update user information.

**Access:** Admin, HR, or own profile

**Path Parameters:**
- `userId` (number): User ID

**Request Body (all fields optional):**
```json
{
  "firstName": "Jane",
  "lastName": "Johnson",
  "email": "jane.johnson@example.com",
  "phone": "+1234567892",
  "department": "Engineering",
  "designation": "Lead Developer",
  "dateOfJoining": "2024-02-01",
  "roleId": 3,
  "isActive": true
}
```

### 7. Update User Hierarchy
**PUT** `/api/users/:userId/hierarchy`

Update user's position in organizational hierarchy.

**Access:** Admin, HR

**Path Parameters:**
- `userId` (number): User ID

**Request Body:**
```json
{
  "parentUserId": 8,
  "hierarchyLevel": 3,
  "relationshipType": "direct_report"
}
```

### 8. Deactivate User
**DELETE** `/api/users/:userId`

Deactivate a user (soft delete).

**Access:** Admin, HR

**Path Parameters:**
- `userId` (number): User ID

**Example Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## User Hierarchy System

The system supports organizational hierarchy through the UserHierarchy model:

### Hierarchy Levels:
- `1` - Top level (Directors, VPs)
- `2-3` - Middle management (Account Managers, Project Managers)
- `4-7` - Individual contributors (Developers, Analysts)

### Relationship Types:
- `direct_report` - Direct reporting relationship
- `indirect_report` - Indirect reporting (skip-level)
- `matrix_report` - Matrix/dotted line reporting

### Team Management Features:
- **Direct Reports**: Get immediate subordinates
- **Recursive Hierarchy**: Get all subordinates at any level
- **Account Manager Teams**: Special handling for client-focused teams
- **Project Teams**: Integration with project assignments

## Examples for Account Managers

### Get My Team (Direct Reports Only):
```bash
GET /api/users/team
```

### Get My Extended Team (All Subordinates):
```bash
GET /api/users/team?includeSubordinates=true
```

### Search Within My Team:
```bash
GET /api/users/team?search=john&includeSubordinates=true
```

### Get Team Statistics:
```bash
GET /api/users/stats
```
This returns your team size and other relevant metrics.

## Testing

Run the provided test script to verify all endpoints:
```bash
node test-user-api.js
```

The test script will:
1. Authenticate with admin credentials
2. Test all user management endpoints
3. Create a test user and verify all operations
4. Clean up by deactivating the test user
