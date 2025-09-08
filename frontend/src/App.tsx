import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/LoginNew";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import ProjectDetails from "./components/ProjectDetails";
import ProjectView from "./components/ProjectView";
import Projects from "./components/Projects";
import Clients from "./components/Clients";
import MyTasks from "./components/tasks/MyTasks";
import AdminLogin from "./admin/components/AdminLogin";
import AdminDashboard from "./admin/components/AdminDashboard";
import BillingNew from "./pages/BillingNew";
import BillingDetailNew from "./pages/BillingDetailNew";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import TimesheetView from "./components/timesheet/TimesheetView";
import DashboardNew from "./pages/DashboardNew";
import ProjectsNew from "./pages/ProjectsNew";
import ClientsNew from "./pages/ClientsNew";
import TasksNew from "./pages/TasksNew";
import ProjectDetailNew from "./pages/ProjectDetailNew";
import ClientDetailNew from "./pages/ClientDetailNew";
import TeamsNew from "./pages/TeamsNew";
import TeamMemberDetailNew from "./pages/TeamMemberDetailNew";
import TaskDetailNew from "./pages/TaskDetailNew";
import TimesheetNew from "./pages/TimesheetNew";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-details/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project-view/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectView />
                </ProtectedRoute>
              }
            />
            <Route
        path="/timesheet/view"
        element={
          <ProtectedRoute>
            <TimesheetView />
          </ProtectedRoute>
        }
      />
            <Route
              path="/app/timesheet"
              element={
                <ProtectedRoute>
                  <TimesheetNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetailNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/legacy/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <ClientsNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute>
                  <ClientDetailNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/legacy/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <TeamsNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/:id"
              element={
                <ProtectedRoute>
                  <TeamMemberDetailNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:id"
              element={
                <ProtectedRoute>
                  <TaskDetailNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/legacy/tasks"
              element={
                <ProtectedRoute>
                  <MyTasks />
                </ProtectedRoute>
              }
            />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <BillingNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/:id"
              element={
                <ProtectedRoute>
                  <BillingDetailNew />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
      
    </AuthProvider>
  );
}

export default App;
