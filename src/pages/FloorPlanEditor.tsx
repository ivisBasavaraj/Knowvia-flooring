import React, { useEffect, useState } from 'react';
import { Canvas } from '../components/canvas/Canvas';
import { ToolsPanel } from '../components/panels/ToolsPanel';
import { PropertiesPanel } from '../components/panels/PropertiesPanel';
import { FloorPlanPreview } from '../components/preview/FloorPlanPreview';
import { FloorPlanManager } from '../components/dashboard/FloorPlanManager';
import { MainMenu } from '../components/navigation/MainMenu';
import { useCanvasStore } from '../store/canvasStore';
import { useAuthStore } from '../store/authStore';
import { useParams, useNavigate } from 'react-router-dom';
import { BoothElement, TextElement } from '../types/canvas';
import { floorPlanAPI } from '../services/api';
import { FontAwesomeIcon } from '../components/icons/FontAwesomeIcon';

export const FloorPlanEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addElement, resetCanvas, elements, canvasSize, activeTool, grid } = useCanvasStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFloorPlanManager, setShowFloorPlanManager] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  
  // Effect to create a sample booth when the editor loads
  useEffect(() => {
    try {
      console.log("FloorPlanEditor initialized with id:", id);
      console.log("Current canvas state:", useCanvasStore.getState());
      
      // Reset the canvas state for a new floor plan
      if (id === 'new') {
        // Clear any existing elements if this is a new floor plan
        console.log("Creating new floor plan, clearing canvas");
        resetCanvas();
        console.log("Canvas state after clearing:", useCanvasStore.getState());
        
        // Add sample elements for new floor plan
        console.log("Adding sample elements to canvas");
        // Add a sample booth
        addElement({
          type: 'booth',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
          fill: '#FFFFFF',
          stroke: '#333333',
          strokeWidth: 1,
          draggable: true,
          layer: 1,
          customProperties: {},
          number: '101',
          status: 'reserved',
          dimensions: {
            imperial: '10\' x 10\'',
            metric: '3m x 3m'
          },
          exhibitor: {
            companyName: 'TechExpo Solutions',
            description: 'Leading provider of event technology solutions',
            category: 'Technology',
            contact: {
              phone: '(555) 123-4567',
              email: 'info@techexpo.example.com',
              website: 'https://techexpo.example.com'
            }
          }
        } as Omit<BoothElement, 'id' | 'selected'>);
        
        // Add some text
        addElement({
          type: 'text',
          x: 300,
          y: 150,
          width: 200,
          height: 50,
          rotation: 0,
          fill: '#333333',
          stroke: '',
          strokeWidth: 0,
          draggable: true,
          layer: 2,
          customProperties: {},
          text: 'Exhibition Hall A',
          fontSize: 24,
          fontFamily: 'Arial',
          align: 'center',
          fontStyle: 'bold'
        } as Omit<TextElement, 'id' | 'selected'>);
        
        console.log("Canvas state after adding elements:", useCanvasStore.getState());
      } else {
        // For existing floor plans, check if we need to add sample elements
        const elements = useCanvasStore.getState().elements;
        if (elements.length === 0) {
          console.log("Existing floor plan is empty, adding sample elements");
          // Add a sample booth
          addElement({
            type: 'booth',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            rotation: 0,
            fill: '#FFFFFF',
            stroke: '#333333',
            strokeWidth: 1,
            draggable: true,
            layer: 1,
            customProperties: {},
            number: '102',
            status: 'available',
            dimensions: {
              imperial: '10\' x 10\'',
              metric: '3m x 3m'
            }
          } as Omit<BoothElement, 'id' | 'selected'>);
          
          // Add some text
          addElement({
            type: 'text',
            x: 300,
            y: 150,
            width: 200,
            height: 50,
            rotation: 0,
            fill: '#333333',
            stroke: '',
            strokeWidth: 0,
            draggable: true,
            layer: 2,
            customProperties: {},
            text: 'Exhibition Hall A',
            fontSize: 24,
            fontFamily: 'Arial',
            align: 'center',
            fontStyle: 'bold'
          } as Omit<TextElement, 'id' | 'selected'>);
        }
      }
      
      console.log("Final canvas state before rendering:", useCanvasStore.getState());
      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing floor plan editor:", err);
      setError("Failed to initialize the floor plan editor. Please try again.");
      setIsLoading(false);
    }
  }, [addElement, id, navigate]);
  
  // Listen for custom events from MainMenu
  useEffect(() => {
    const handleShowFloorPlanManager = () => {
      setShowFloorPlanManager(true);
    };

    window.addEventListener('showFloorPlanManager', handleShowFloorPlanManager);
    return () => {
      window.removeEventListener('showFloorPlanManager', handleShowFloorPlanManager);
    };
  }, []);

  // Save floor plan function
  const saveFloorPlan = async () => {
    if (!user) {
      setSaveStatus('Please login to save floor plans');
      return;
    }

    setIsSaving(true);
    setSaveStatus('Saving...');

    try {
      const floorPlanData = {
        name: `Floor Plan ${new Date().toLocaleDateString()}`,
        description: 'Created with IMTMA Flooring Editor',
        event_id: 'imtma_2024',
        floor: 1,
        state: {
          elements: elements.map(el => ({
            ...el,
            // Ensure booth elements have all required properties
            ...(el.type === 'booth' && {
              number: (el as BoothElement).number || `B${Math.floor(Math.random() * 1000)}`,
              status: (el as BoothElement).status || 'available',
              price: (el as BoothElement).price || 500,
              dimensions: (el as BoothElement).dimensions || {
                imperial: '10x10 ft',
                metric: '3x3 m'
              },
              exhibitor: (el as BoothElement).exhibitor || null
            })
          })),
          canvasSize,
          zoom: 1,
          offset: { x: 0, y: 0 },
          grid: {
            enabled: true,
            size: 20,
            snap: true,
            opacity: 0.3
          }
        }
      };

      const result = await floorPlanAPI.createFloorPlan(floorPlanData);
      
      if (result.success) {
        setSaveStatus('✅ Saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('❌ Save failed');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('❌ Save failed - Check if backend is running');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save effect (would be implemented with throttling in a real app)
  useEffect(() => {
    const saveInterval = setInterval(() => {
      console.log('Auto-saving floor plan...');
      // Implementation would store the canvas state
    }, 30000);
    
    return () => clearInterval(saveInterval);
  }, []);
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading floor plan editor...</p>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-medium text-red-700 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <MainMenu />
          <div className="h-8 w-px bg-gray-300"></div>
          <h1 className="text-xl font-medium">Floor Plan Editor {id === 'new' ? '- New Plan' : ''}</h1>
          {saveStatus && (
            <span className="text-sm px-2 py-1 rounded bg-blue-50 text-blue-700">
              {saveStatus}
            </span>
          )}
          
          {/* Enhanced Debug Info */}
          <div className="text-xs text-gray-500 flex items-center space-x-4">
            <span>Elements: {elements.length}</span>
            <span>Selected: {useCanvasStore.getState().selectedIds.length}</span>
            <span>Tool: {activeTool}</span>
            <span>Grid: {grid.enabled ? (grid.snap ? 'Snap On' : 'Visible') : 'Off'}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
            onClick={() => setShowPreview(true)}
          >
            <FontAwesomeIcon icon="fas fa-eye" size={16} />
            <span>Preview</span>
          </button>
          
          <button 
            className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
            onClick={saveFloorPlan}
            disabled={isSaving}
          >
            <FontAwesomeIcon icon="fas fa-save" size={16} />
            <span>{isSaving ? 'Saving...' : 'Save to Backend'}</span>
          </button>
          
          <button 
            className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm transition-colors"
            onClick={() => {
              // Add various test elements to showcase icon scaling
              const testElements = [
                // Small booth
                {
                  type: 'booth',
                  x: 100,
                  y: 100,
                  width: 60,
                  height: 40,
                  rotation: 0,
                  fill: '#FFE4B5',
                  stroke: '#FFA500',
                  strokeWidth: 2,
                  draggable: true,
                  layer: 1,
                  customProperties: {},
                  number: `S-${Math.floor(Math.random() * 10)}`,
                  status: 'available',
                  dimensions: { imperial: '6\' x 4\'', metric: '2m x 1.2m' }
                },
                // Medium booth
                {
                  type: 'booth',
                  x: 200,
                  y: 100,
                  width: 120,
                  height: 80,
                  rotation: 0,
                  fill: '#FFE4B5',
                  stroke: '#FFA500',
                  strokeWidth: 2,
                  draggable: true,
                  layer: 1,
                  customProperties: {},
                  number: `M-${Math.floor(Math.random() * 10)}`,
                  status: 'reserved',
                  dimensions: { imperial: '12\' x 8\'', metric: '3.6m x 2.4m' }
                },
                // Large booth
                {
                  type: 'booth',
                  x: 350,
                  y: 100,
                  width: 180,
                  height: 120,
                  rotation: 0,
                  fill: '#FFE4B5',
                  stroke: '#FFA500',
                  strokeWidth: 2,
                  draggable: true,
                  layer: 1,
                  customProperties: {},
                  number: `L-${Math.floor(Math.random() * 10)}`,
                  status: 'sold',
                  dimensions: { imperial: '18\' x 12\'', metric: '5.4m x 3.6m' }
                }
              ];
              
              // Add all test elements
              testElements.forEach(element => {
                addElement(element as Omit<BoothElement, 'id' | 'selected'>);
              });
            }}
          >
            <span>🧪 Test Icon Scaling</span>
          </button>
          
          <button 
            className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
            onClick={() => {
              // Add various element types to test all icons
              const elementTypes = [
                { type: 'furniture', furnitureType: 'meeting-room', width: 80, height: 60, x: 100, y: 250 },
                { type: 'furniture', furnitureType: 'restroom', width: 60, height: 60, x: 200, y: 250 },
                { type: 'furniture', furnitureType: 'medical', width: 70, height: 50, x: 280, y: 250 },
                { type: 'door', furnitureType: 'emergency', width: 40, height: 80, x: 100, y: 350 },
                { type: 'plant', width: 50, height: 50, x: 160, y: 350 },
              ];
              
              elementTypes.forEach(elem => {
                addElement({
                  ...elem,
                  rotation: 0,
                  fill: '#F5F5F5',
                  stroke: '#666',
                  strokeWidth: 1,
                  draggable: true,
                  layer: 1,
                  customProperties: {}
                } as any);
              });
            }}
          >
            <span>🎨 Test All Icons</span>
          </button>
          
          <button 
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
            onClick={() => setShowFloorPlanManager(true)}
          >
            <FontAwesomeIcon icon="fas fa-folder-open" size={16} />
            <span>Manage Plans</span>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tools panel */}
        <div className="p-4">
          <ToolsPanel />
        </div>
        
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas />
        </div>
        
        {/* Properties panel */}
        <div className="p-4">
          <PropertiesPanel />
        </div>
      </div>
      
      {/* Preview Modal */}
      {showPreview && (
        <FloorPlanPreview onClose={() => setShowPreview(false)} />
      )}

      {/* Floor Plan Manager Modal */}
      {showFloorPlanManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-7xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Floor Plan Manager (Backend API)</h2>
              <button
                onClick={() => setShowFloorPlanManager(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <FloorPlanManager currentUser={user} />
          </div>
        </div>
      )}
    </div>
  );
};