import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/LoginNew";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import ProjectDetails from "./components/ProjectDetails";
import ProjectView from "./components/ProjectView";
import Projects from "./components/Projects";
import MyTasks from "./components/tasks/MyTasks";
import AdminLogin from "./admin/components/AdminLogin";
import AdminDashboard from "./admin/components/AdminDashboard";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import TimesheetView from "./components/timesheet/TimesheetView";

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
                  {React.createElement(require('./pages/DashboardNew').default)}
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
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <MyTasks />
                </ProtectedRoute>
              }
            />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
      
    </AuthProvider>
  );
}

export default App;
