import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import WorkspacePage from './pages/WorkspacePage';
import ConversationListPage from './pages/ConversationListPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import HelpPage from './pages/HelpPage';
import { AuthProvider, useAuth } from './components/AuthContext';
import './App.scss';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes that are standalone */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* **التعديل الجذري هنا** */}
          {/* This route is private but does NOT use the main Layout (no sidebar) */}
          <Route 
            path="/change-password" 
            element={
              <PrivateRoute>
                <ChangePasswordPage />
              </PrivateRoute>
            } 
          />

          {/* Private routes that ARE inside the main Layout (with sidebar) */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<ConversationListPage />} />
            <Route path="conversation/:id" element={<WorkspacePage />} />
            <Route path="settings" element={<SettingsPage />} /> 
            <Route path="help" element={<HelpPage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;