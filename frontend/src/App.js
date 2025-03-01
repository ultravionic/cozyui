import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkflowEditorPage from './pages/WorkflowEditorPage';
import WorkflowsPage from './pages/WorkflowsPage';
import OutputsPage from './pages/OutputsPage';
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, currentUser } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="editor" element={<WorkflowEditorPage />} />
        <Route path="editor/:workflowId" element={<WorkflowEditorPage />} />
        <Route path="workflows" element={<WorkflowsPage />} />
        <Route path="outputs" element={<OutputsPage />} />
        <Route path="users" element={
          <AdminRoute>
            <UserManagementPage />
          </AdminRoute>
        } />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
