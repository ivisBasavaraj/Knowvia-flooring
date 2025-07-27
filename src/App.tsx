import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { initAuth, useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { FloorPlanEditor } from './pages/FloorPlanEditor';
import LandingPage from './pages/LandingPage';

function App() {
  // Initialize auth on app load
  useEffect(() => {
    initAuth();
  }, []);
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Make landing page the root route */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoutes />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/floor-plans/new" element={<FloorPlanEditor />} />
            <Route path="/floor-plans/:id" element={<FloorPlanEditor />} />
          </Route>
        </Route>
        
        {/* Redirect any unknown routes to landing page or dashboard based on auth status */}
        <Route path="*" element={<LandingRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

// Protected route wrapper
const ProtectedRoutes = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

// This function is kept for potential future use
// Redirect root path based on auth status
const RootRedirect = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/" />;
};

// Redirect to landing page or dashboard based on auth status
const LandingRedirect = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/" />;
};

export default App;