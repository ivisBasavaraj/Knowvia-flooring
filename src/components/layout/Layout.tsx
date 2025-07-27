import React from 'react';
import { Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
  return (
    <div className="h-screen bg-gray-50">
      {/* Full width layout without sidebar navigation */}
      <div className="h-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};