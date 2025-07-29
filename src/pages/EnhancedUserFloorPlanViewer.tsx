import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '../components/icons/FontAwesomeIcon';
import { useAuthStore } from '../store/authStore';
import { publicFloorPlanAPI } from '../services/api';
import { useCanvasStore } from '../store/canvasStore';
import { ViewMode2D } from '../components/preview/ViewMode2D';
import { ViewMode3D } from '../components/preview/ViewMode3D';
import { UserBoothInfoPopup } from '../components/user/UserBoothInfoPopup';
import { UserSponsorHeader } from '../components/user/UserSponsorHeader';
// Note: ViewerControls and FloorNavigation removed as they depend on floorPlanViewerStore
// We have our own enhanced controls built into the component
import { BoothElement } from '../types/canvas';
import '../styles/FloorPlanViewer.css';

interface FloorPlan {
  id: string;
  name: string;
  description?: string;
  created: string;
  last_modified: string;
  status: string;
  state?: any;
  booth_details?: any[];
  stats?: {
    total_booths: number;
    sold: number;
    available: number;
    reserved: number;
  };
}

interface Company {
  id: string;
  name: string;
  booth_number: string;
  floor: number;
  status: 'available' | 'sold' | 'reserved';
  category: string;
  description?: string;
  logo?: string;
  featured: boolean;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  website?: string;
}

interface SponsorLogo {
  id: string;
  name: string;
  logo: string;
  website?: string;
}

export const EnhancedUserFloorPlanViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // State management
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<FloorPlan | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sponsors, setSponsors] = useState<SponsorLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<BoothElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Canvas store
  const { 
    elements, 
    loadFloorPlan, 
    setViewerMode,
    resetCanvas 
  } = useCanvasStore();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get initial view mode from URL params
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === '2d' || mode === '3d') {
      setViewMode(mode);
    }
  }, [searchParams]);

  // Update URL when view mode changes
  useEffect(() => {
    if (selectedFloorPlan) {
      setSearchParams({ mode: viewMode });
    }
  }, [viewMode, selectedFloorPlan, setSearchParams]);

  // Set viewer mode when component mounts
  useEffect(() => {
    setViewerMode(viewMode);
    return () => setViewerMode('editor');
  }, [viewMode, setViewerMode]);

  useEffect(() => {
    loadFloorPlans();
    loadSponsorsFromBackend();
  }, []);

  // Load companies after elements are loaded
  useEffect(() => {
    if (elements.length > 0) {
      loadCompaniesFromBackend();
    }
  }, [elements]);

  // Load specific floor plan if ID is provided
  useEffect(() => {
    if (id && floorPlans.length > 0) {
      const plan = floorPlans.find(fp => fp.id === id);
      if (plan) {
        loadFloorPlanDetails(plan);
      }
    }
  }, [id, floorPlans]);

  // Filter companies based on search term and floor
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = searchTerm === '' || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.booth_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFloor = company.floor === selectedFloor;
      
      return matchesSearch && matchesFloor;
    }).sort((a, b) => {
      // Featured companies first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [companies, searchTerm, selectedFloor]);

  const loadCompaniesFromBackend = async () => {
    try {
      // Try to load companies from backend API
      const result = await publicFloorPlanAPI.getPublicCompanies();
      if (result.success && result.data.companies) {
        setCompanies(result.data.companies);
        return;
      }
    } catch (error) {
      console.log('Backend companies not available, using booth data from floor plan');
    }
    
    // Fallback: Extract company data from booth elements in the floor plan
    loadCompaniesFromFloorPlan();
  };

  const loadCompaniesFromFloorPlan = () => {
    // Extract booth information from canvas elements
    const boothElements = elements.filter(el => el.type === 'booth') as BoothElement[];
    
    const companiesFromBooths: Company[] = boothElements.map((booth, index) => {
      // Generate realistic company data based on booth
      const categories = ['Technology', 'Healthcare', 'Finance', 'Education', 'Energy', 'Marketing', 'Manufacturing', 'Retail'];
      const category = categories[index % categories.length];
      
      const companyNames = [
        'TechCorp Solutions', 'Green Energy Inc', 'Digital Marketing Pro', 'Healthcare Innovations',
        'Financial Services Group', 'Education Tech', 'Smart Manufacturing', 'Retail Excellence',
        'Data Analytics Pro', 'Cloud Solutions Inc', 'AI Innovations', 'Cyber Security Corp',
        'Mobile Tech Solutions', 'E-commerce Platform', 'Business Intelligence', 'Software Development Co'
      ];
      
      const name = companyNames[index % companyNames.length] || `Company ${booth.number}`;
      const featured = index < 4; // First 4 companies are featured
      const statuses: ('available' | 'sold' | 'reserved')[] = ['sold', 'reserved', 'available'];
      const status = statuses[index % 3];
      
      return {
        id: booth.id,
        name,
        booth_number: booth.number,
        floor: 1, // Default to floor 1, can be enhanced later
        category,
        featured,
        status,
        logo: `https://via.placeholder.com/40x40/${status === 'sold' ? '007bff' : status === 'reserved' ? '28a745' : '6c757d'}/ffffff?text=${name.charAt(0)}`,
        description: `${name} - Leading provider of ${category.toLowerCase()} solutions`,
        contact: {
          email: `info@${name.toLowerCase().replace(/\s+/g, '')}.com`,
          website: `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`
        }
      };
    });
    
    setCompanies(companiesFromBooths);
  };

  const loadSponsorsFromBackend = async () => {
    try {
      // Try to load sponsors from backend API
      const result = await publicFloorPlanAPI.getPublicSponsors();
      if (result.success && result.data.sponsors) {
        setSponsors(result.data.sponsors);
        return;
      }
    } catch (error) {
      console.log('Backend sponsors not available, using sample data');
    }
    
    // Fallback: Sample sponsors data
    const sampleSponsors: SponsorLogo[] = [
      { id: '1', name: 'Microsoft', logo: 'https://via.placeholder.com/120x60/0078d4/ffffff?text=Microsoft', website: 'https://microsoft.com' },
      { id: '2', name: 'Google', logo: 'https://via.placeholder.com/120x60/4285f4/ffffff?text=Google', website: 'https://google.com' },
      { id: '3', name: 'Amazon', logo: 'https://via.placeholder.com/120x60/ff9900/ffffff?text=Amazon', website: 'https://amazon.com' },
      { id: '4', name: 'Apple', logo: 'https://via.placeholder.com/120x60/000000/ffffff?text=Apple', website: 'https://apple.com' },
      { id: '5', name: 'IBM', logo: 'https://via.placeholder.com/120x60/1261fe/ffffff?text=IBM', website: 'https://ibm.com' }
    ];
    
    setSponsors(sampleSponsors);
  };

  const loadFloorPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await publicFloorPlanAPI.getPublicFloorPlans();
      
      if (result.success) {
        const plans = result.data.floorplans || [];
        setFloorPlans(plans);
        
        // If no specific ID, select the first plan
        if (!id && plans.length > 0) {
          loadFloorPlanDetails(plans[0]);
        }
      } else {
        setError(result.data.message || 'Failed to load floor plans');
      }
    } catch (error) {
      console.error('Failed to load floor plans:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const loadFloorPlanDetails = async (plan: FloorPlan) => {
    try {
      setSelectedFloorPlan(plan);
      
      // Load detailed floor plan data
      const result = await publicFloorPlanAPI.getPublicFloorPlan(plan.id);
      
      if (result.success && result.data.floorplan) {
        const detailedPlan = result.data.floorplan;
        
        // Load the floor plan state into canvas store
        if (detailedPlan.state) {
          loadFloorPlan(detailedPlan.state);
        } else {
          resetCanvas();
        }
      }
    } catch (error) {
      console.error('Failed to load floor plan details:', error);
    }
  };

  const handleBoothClick = (boothId: string) => {
    const booth = elements.find(
      (element) => element.id === boothId && element.type === 'booth'
    ) as BoothElement | undefined;
    
    if (booth) {
      setSelectedBooth(booth);
    }
  };

  const closeBoothInfo = () => {
    setSelectedBooth(null);
  };

  const handleCompanyClick = (company: Company) => {
    // Find the booth element that matches this company
    const boothElement = elements.find(
      (element) => element.type === 'booth' && 
      (element as BoothElement).number === company.booth_number
    ) as BoothElement | undefined;
    
    if (boothElement) {
      setSelectedBooth(boothElement);
    }
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-800 px-1 rounded">
          {part}
        </span>
      ) : part
    );
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedBooth) {
          closeBoothInfo();
        } else if (!sidebarCollapsed) {
          setSidebarCollapsed(true);
        }
      }
      if (event.key === 'Tab') {
        setSidebarCollapsed(!sidebarCollapsed);
        event.preventDefault();
      }
      if (event.key === '1' && event.ctrlKey) {
        setViewMode('2d');
        event.preventDefault();
      }
      if (event.key === '2' && event.ctrlKey) {
        setViewMode('3d');
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, selectedBooth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading floor plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon="fas fa-exclamation-triangle" size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadFloorPlans}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (floorPlans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <FontAwesomeIcon icon="fas fa-map" size={64} className="text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Floor Plans Available</h3>
          <p className="text-gray-600 mb-4">There are currently no published floor plans to view.</p>
          <button 
            onClick={loadFloorPlans}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col floor-plan-viewer">
      {/* Enhanced Sponsor Header */}
      <UserSponsorHeader sponsors={sponsors} />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Enhanced Left Sidebar - Company Listings */}
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'
        }`}>
          <div className="h-full flex flex-col">
            {/* Professional Search Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Exhibitors Directory</h2>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  title="Close sidebar"
                >
                  <FontAwesomeIcon icon="fas fa-times" size={16} />
                </button>
              </div>
              
              <div className="search-container">
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center">
                    <FontAwesomeIcon icon="fas fa-search" size={14} className="search-icon text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search company, booth or category"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <FontAwesomeIcon icon="fas fa-times" size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Search Results Count */}
              <div className="mt-3 text-sm text-gray-600">
                {searchTerm ? (
                  <span>{filteredCompanies.length} results found</span>
                ) : (
                  <span>{filteredCompanies.length} exhibitors on Floor {selectedFloor}</span>
                )}
              </div>
            </div>

            {/* Enhanced Company List */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-4 space-y-3">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className={`cursor-pointer group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${
                      company.featured ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
                    }`}
                    onClick={() => handleCompanyClick(company)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Company Logo */}
                      <div className="flex-shrink-0 relative">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://via.placeholder.com/48x48/e9ecef/6c757d?text=${company.name.charAt(0)}`;
                            }}
                          />
                        </div>
                        {company.featured && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon="fas fa-star" size={10} className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 truncate mb-1">
                              {highlightSearchTerm(company.name, searchTerm)}
                            </h3>
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-medium text-blue-600">
                                Booth {highlightSearchTerm(company.booth_number, searchTerm)}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 font-medium">
                                Floor {company.floor}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                company.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                company.status === 'reserved' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {company.status === 'sold' ? 'Occupied' : 
                                 company.status === 'reserved' ? 'Reserved' : 'Available'}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {company.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative">
          {/* Sidebar Toggle Button */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="absolute top-4 left-4 z-20 bg-white border border-gray-300 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all duration-200"
              title="Open sidebar"
            >
              <FontAwesomeIcon icon="fas fa-bars" size={16} className="text-gray-600" />
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="absolute top-4 right-4 z-20 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === '2d' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon="fas fa-map" size={14} className="mr-2" />
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === '3d' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon="fas fa-cube" size={14} className="mr-2" />
              3D
            </button>
          </div>

          {/* Floor Plan Canvas */}
          <div className="h-full">
            {selectedFloorPlan ? (
              <>
                {viewMode === '2d' ? (
                  <ViewMode2D 
                    onBoothClick={handleBoothClick} 
                    selectedBoothId={selectedBooth?.id}
                  />
                ) : (
                  <ViewMode3D 
                    onBoothClick={handleBoothClick} 
                    selectedBoothId={selectedBooth?.id}
                  />
                )}
                
                {/* Booth info popup */}
                {selectedBooth && (
                  <UserBoothInfoPopup 
                    booth={selectedBooth} 
                    company={companies.find(c => c.booth_number === selectedBooth.number)}
                    onClose={closeBoothInfo} 
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FontAwesomeIcon icon="fas fa-map" size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-600">Loading floor plan...</p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Zoom Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-20">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
              <button
                onClick={() => {
                  // Zoom in functionality - can be enhanced later
                  console.log('Zoom in');
                }}
                className="block w-full p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                title="Zoom In"
              >
                <FontAwesomeIcon icon="fas fa-plus" size={16} />
              </button>
              <button
                onClick={() => {
                  // Zoom out functionality - can be enhanced later
                  console.log('Zoom out');
                }}
                className="block w-full p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                title="Zoom Out"
              >
                <FontAwesomeIcon icon="fas fa-minus" size={16} />
              </button>
              <button
                onClick={() => {
                  // Fit to screen functionality - can be enhanced later
                  console.log('Fit to screen');
                }}
                className="block w-full p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                title="Fit to Screen"
              >
                <FontAwesomeIcon icon="fas fa-expand" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};