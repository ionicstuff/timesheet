# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo with Node.js/Express backend (Sequelize/PostgreSQL) and React frontend (Create React App + TypeScript).
- Key paths: backend/, frontend/, timesheet.sql, backend/docs/.

Common commands
Backend (Node/Express, Sequelize)
- Install deps: npm install --prefix backend
- Start (prod): npm start --prefix backend
- Start (dev, with reload): npm run dev --prefix backend
- Run DB migrations + seeders: node backend/scripts/runMigrations.js
- API smoke tests (ad hoc scripts):
  - node backend/test-api.js
  - node backend/test-auth.js
  - node backend/test-user-api.js
  - node backend/test-profile-api.js
  - node backend/test-admin-api.js
  - node backend/tests/testGetProject.js
  - node backend/tests/testProjectQuery.js
- Generate a test token (utility): node backend/get-test-token.js
- One-off scripts (examples):
  - node backend/scripts/createAdminUser.js
  - node backend/fix-admin-role.js
  - node backend/quick-fix-admin.js

Notes
- There is no configured backend test runner in package.json (scripts.test is a placeholder). Use the provided Node scripts above for endpoint checks.
- Environment variables are required for DB and server config (see Environment section).

Frontend (React + TypeScript - CRA)
- Install deps: npm install --prefix frontend
- Start dev server: npm start --prefix frontend
- Build: npm run build --prefix frontend
- Tests (watch mode): npm test --prefix frontend
- Run a single test (pattern): npm test --prefix frontend -- App.test
  - You can pass any pattern to filter test files or test names.

Environment
Create backend/.env with at least:
- PORT: defaults to 3000 if not set (server.js)
- NODE_ENV: development or production
- CORS_ORIGIN: default 'http://localhost:3001' (adjust to frontend origin)
- RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX: optional (rate limiter)
- DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT: required for Sequelize (PostgreSQL)

Database setup
- Option A (SQL import): psql -U <user> -d <db> -f timesheet.sql
- Option B (migrations + seeders): node backend/scripts/runMigrations.js
  - The migration runner authenticates using backend/config/database.js which reads backend/.env

High-level architecture
Backend
- Entry: backend/server.js
  - Express app with security (helmet), rate limiting, CORS, JSON parsing, logging (morgan)
  - Health check: GET /api/health
  - Route mounting:
    - /api/auth -> routes/auth
    - /api/users -> routes/userRoutes
    - /api/timesheet -> routes/timesheet
    - /api/timesheet-entries -> routes/timesheetEntryRoutes
    - /api/clients -> routes/clients
    - /api/client-management -> routes/clientRoutes
    - /api/projects -> routes/projectRoutes
    - /api/spocs -> routes/spocRoutes
    - /api/tasks -> routes/taskRoutes
    - /api/admin -> admin/routes/admin
  - Central error handler and 404 fallback
- Persistence: backend/config/database.js creates a Sequelize instance (PostgreSQL) from environment variables; logging enabled only in development.
- Data model: backend/models/ contains Sequelize models for Users, Roles/Permissions, Clients, Projects, Tasks, Timesheet(s), SPOCs, UserHierarchy, and association setup (associations.js, index.js). Migrations and seeders live under backend/migrations and backend/seeders respectively; scripts/runMigrations.js applies both in filename order.
- Access control: backend/middleware/ provides auth (JWT) and role-based authorization; admin-specific middleware under backend/admin/middleware/.
- Modular features:
  - Admin module under backend/admin/ with its own controllers and routes; rate limiter intentionally skips /api/admin (see server.js limiter skip predicate).
  - Timesheet entries split out under controllers/routes for finer-grained endpoints.
  - Email service in backend/services/emailService.js for outbound mail.
- Docs: backend/docs/DATABASE_STRUCTURE.md documents the extended RBAC model, hierarchy, and modules; backend/docs/USER_API.md documents user-related endpoints and testing notes.

Frontend
- CRA TypeScript app (frontend/), with routing, context-based auth (src/context/AuthContext.tsx), and feature areas:
  - Admin area (src/admin/...) with dashboard and management components
  - User-facing components for projects, clients, tasks, timesheets (src/components/...)
  - API access via Axios services (src/services/*.ts and src/admin/services/*.ts)
- Typical data flow: Components -> service layer (Axios) -> backend API; auth context supplies tokens/guards; protected routes via components/ProtectedRoute.tsx.

Conventions and integration points
- Ports: default backend 3000 (per server.js). The top-level README notes 3001; set PORT and CORS_ORIGIN so frontend and backend origins align.
- Single source of DB config: backend/.env consumed by backend/config/database.js; no separate Sequelize CLI config is used.
- Testing: Frontend uses CRA test runner; backend relies on Node scripts for API checks rather than a formal test suite.

References from existing docs
- See README.md for quickstart, endpoint overview, and basic test commands per app.
- See backend/docs/DATABASE_STRUCTURE.md for the RBAC/Hierarchy schema and migration/seed expectations.
- See backend/docs/USER_API.md for user endpoints, parameters, and example calls.

