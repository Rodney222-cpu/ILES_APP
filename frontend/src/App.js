// src/App.js

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Header from "./components/Header/Header";
import RegistrationForm from "./pages/Register/RegistrationForm";
import LoginForm from "./pages/Login/LoginForm";
import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import WorkplaceSupervisorDashboard from "./pages/Dashboard/WorkplaceSupervisorDashboard";
import AcademicSupervisorDashboard from "./pages/Dashboard/AcademicSupervisorDashboard";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import SubmitLogPage from "./pages/SubmitLog/SubmitLogPage";
import { getAuthToken, getUserRole } from "./services/api";

/* 
  Protected Route:
  - Blocks access if user is not authenticated
*/
function PrivateRoute({ children }) {
  const isAuthenticated = !!getAuthToken();

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/*
  Public Route:
  - Prevents logged-in users from going back to login/register
*/
function PublicRoute({ children }) {
  const isAuthenticated = !!getAuthToken();

  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

function RoleRoute({ allowedRoles, children }) {
  const role = getUserRole();
  return allowedRoles.includes(role) ? children : <Navigate to="/" replace />;
}

function DashboardRouter() {
  const role = getUserRole();

  if (role === "student") return <Navigate to="/dashboard/student" replace />;
  if (role === "workplace_supervisor") return <Navigate to="/dashboard/workplace-supervisor" replace />;
  if (role === "academic_supervisor") return <Navigate to="/dashboard/academic-supervisor" replace />;
  if (role === "admin") return <Navigate to="/dashboard/admin" replace />;

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Header />

      <Routes>
        {/* Protected Home */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardRouter />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard/student"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/submit-log"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={["student"]}>
                <SubmitLogPage />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/workplace-supervisor"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={["workplace_supervisor"]}>
                <WorkplaceSupervisorDashboard />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/academic-supervisor"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={["academic_supervisor"]}>
                <AcademicSupervisorDashboard />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* Public routes */}
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegistrationForm />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;