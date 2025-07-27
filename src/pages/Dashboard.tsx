import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '../components/icons/FontAwesomeIcon';
import { BackgroundUpload } from '../components/dashboard/BackgroundUpload';
import { FloorPlanManager } from '../components/dashboard/FloorPlanManager';
import { useAuthStore } from '../store/authStore';

export const Dashboard: React.FC = () => {
  const [showBackgroundUpload, setShowBackgroundUpload] = useState(false);
  const [showFloorPlanManager, setShowFloorPlanManager] = useState(false);
  const { user } = useAuthStore();
  
  // Mock data
  const recentFloorPlans = [
    { id: '1', name: 'Tech Conference 2025', lastModified: '2025-05-10', boothsSold: 45, totalBooths: 120 },
    { id: '2', name: 'Food Expo', lastModified: '2025-05-08', boothsSold: 78, totalBooths: 150 },
    { id: '3', name: 'Job Fair', lastModified: '2025-05-05', boothsSold: 25, totalBooths: 50 }
  ];
  
  const stats = [
    { label: 'Total Revenue', value: '$125,750', icon: <FontAwesomeIcon icon="fas fa-dollar-sign" size={24} className="text-green-500" /> },
    { label: 'Exhibitors', value: '87', icon: <FontAwesomeIcon icon="fas fa-users" size={24} className="text-blue-500" /> },
    { label: 'Upcoming Events', value: '3', icon: <FontAwesomeIcon icon="fas fa-calendar" size={24} className="text-purple-500" /> },
    { label: 'Occupancy Rate', value: '68%', icon: <FontAwesomeIcon icon="fas fa-chart-line" size={24} className="text-orange-500" /> }
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowFloorPlanManager(true)}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
          >
            <FontAwesomeIcon icon="fas fa-database" size={18} className="mr-2" />
            Manage Floor Plans (API)
          </button>
          
          <button 
            onClick={() => setShowBackgroundUpload(true)}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            <FontAwesomeIcon icon="fas fa-image" size={18} className="mr-2" />
            Quick Start with Background
          </button>
          
          <Link 
            to="/floor-plans/new" 
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            <FontAwesomeIcon icon="fas fa-plus-circle" size={18} className="mr-2" />
            New Floor Plan
          </Link>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 flex items-center">
            <div className="rounded-full p-3 bg-gray-100 mr-4">
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent floor plans */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Floor Plans</h2>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Floor Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Modified
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booths Sold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentFloorPlans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon="fas fa-file-alt" size={18} className="text-blue-500 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{plan.lastModified}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {plan.boothsSold} / {plan.totalBooths}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(plan.boothsSold / plan.totalBooths) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={`/floor-plans/${plan.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                    Edit
                  </Link>
                  <a href="#" className="text-blue-600 hover:text-blue-900">
                    Preview
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Recent activity */}
      <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">Recent Activity</h2>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="rounded-full bg-blue-100 p-2 text-blue-600 mr-4">
              <Users size={16} />
            </div>
            <div>
              <p className="text-sm text-gray-900">
                <span className="font-medium">John Doe</span> reserved booth #145 for Tech Conference 2025
              </p>
              <p className="text-xs text-gray-500 mt-1">Today, 2:30 PM</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="rounded-full bg-green-100 p-2 text-green-600 mr-4">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="text-sm text-gray-900">
                <span className="font-medium">ABC Company</span> purchased booth #78 for $2,500
              </p>
              <p className="text-xs text-gray-500 mt-1">Yesterday, 11:15 AM</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="rounded-full bg-purple-100 p-2 text-purple-600 mr-4">
              <FontAwesomeIcon icon="fas fa-file-alt" size={16} />
            </div>
            <div>
              <p className="text-sm text-gray-900">
                <span className="font-medium">You</span> created a new floor plan "Job Fair"
              </p>
              <p className="text-xs text-gray-500 mt-1">May 5, 2025</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floor Plan Manager Modal */}
      {showFloorPlanManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-7xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Floor Plan Manager (Backend API)</h2>
              <button
                onClick={() => setShowFloorPlanManager(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <FloorPlanManager currentUser={user} />
          </div>
        </div>
      )}

      {/* Background Upload Modal */}
      {showBackgroundUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <BackgroundUpload onClose={() => setShowBackgroundUpload(false)} />
          </div>
        </div>
      )}
    </div>
  );
};