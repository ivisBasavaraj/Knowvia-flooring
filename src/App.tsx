import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { initAuth, useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { FloorPlanEditor } from './pages/FloorPlanEditor';
// FloorPlanViewerPage removed - features integrated into UserFloorPlanViewer
import { UserFloorPlanViewer } from './pages/UserFloorPlanViewer';
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
            {/* Admin-only routes */}
            <Route path="/dashboard" element={<AdminOnlyRoute><Dashboard /></AdminOnlyRoute>} />
            <Route path="/admin/floor-plans/new" element={<AdminOnlyRoute><FloorPlanEditor /></AdminOnlyRoute>} />
            <Route path="/admin/floor-plans/:id/edit" element={<AdminOnlyRoute><FloorPlanEditor /></AdminOnlyRoute>} />
            
            {/* User routes */}
            <Route path="/floor-plans" element={<UserFloorPlanViewer />} />
            <Route path="/floor-plans/:id" element={<UserFloorPlanViewer />} />
          </Route>
        </Route>
        
        {/* Public viewer route redirects to main floor plans page */}
        <Route path="/viewer/:id" element={<UserFloorPlanViewer />} />
        
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

// Admin-only route wrapper
const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/floor-plans" />;
  }
  
  return <>{children}</>;
};

// This function is kept for potential future use
// Redirect root path based on auth status
const RootRedirect = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/" />;
};

// Redirect to landing page or appropriate page based on auth status and role
const LandingRedirect = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  // Redirect based on user role
  if (user?.role === 'admin') {
    return <Navigate to="/dashboard" />;
  } else {
    return <Navigate to="/floor-plans" />;
  }
};

export default App;