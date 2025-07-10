# Timesheet Management System

A comprehensive timesheet and HR management system inspired by Keka.com, built with Node.js backend and React frontend.

## Project Structure

```
timesheet/
├── backend/          # Node.js backend with Express and Sequelize
├── frontend/         # React frontend application
├── timesheet.sql     # Database schema
├── FEATURE_ANALYSIS.md  # Feature analysis document
└── README.md         # This file
```

## Features

- **User Authentication**: JWT-based login and registration
- **Dashboard**: User-friendly dashboard with navigation
- **Timesheet Management**: Track work hours and projects
- **Project Management**: Manage projects and tasks
- **Leave Management**: Request and track leave
- **Role-based Access**: Different user roles and permissions
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Backend
- Node.js
- Express.js
- Sequelize ORM
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18
- React Router DOM
- Axios for API calls
- Bootstrap 5 for styling
- Context API for state management

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a PostgreSQL database and update the connection details in `config/config.json`

4. Run the SQL schema:
   ```bash
   psql -U your_username -d your_database -f ../timesheet.sql
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get user profile (protected)

### Timesheet
- `GET /api/timesheet` - Get timesheets (protected)
- `POST /api/timesheet` - Create timesheet entry (protected)

## Database Schema

The project uses a comprehensive database schema with tables for:
- Users and authentication
- Timesheets and work tracking
- Projects and tasks
- Leave management
- Roles and permissions
- Client management
- Shifts and attendance

See `timesheet.sql` for the complete schema.

## Development

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
