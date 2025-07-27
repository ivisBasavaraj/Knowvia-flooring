
import React, { ReactElement } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { FontAwesomeIcon } from '../icons/FontAwesomeIcon';

import './tools-panel.css';

// Define interfaces for our tool items
interface ToolItem {
  id: string;
  icon: ReactElement;
  label: string;
}

interface ActionItem extends ToolItem {
  action: () => void;
  disabled: boolean;
}

export const ToolsPanel: React.FC = () => {
  const { 
    activeTool, 
    selectedIds, 
    setActiveTool,
    deleteElements,
    duplicateElements,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack
  } = useCanvasStore();
  
  const hasSelection = selectedIds.length > 0;
  
  const tools: ToolItem[] = [
    { id: 'select', icon: <FontAwesomeIcon icon="fas fa-mouse-pointer" className="tool-icon" size={18} />, label: 'Select' },
    { id: 'booth', icon: <FontAwesomeIcon icon="fas fa-th-large" className="tool-icon" size={18} />, label: 'Booth' },
    { id: 'rectangle', icon: <FontAwesomeIcon icon="far fa-square" className="tool-icon" size={18} />, label: 'Rectangle' },
    { id: 'circle', icon: <FontAwesomeIcon icon="far fa-circle" className="tool-icon" size={18} />, label: 'Circle' },
    { id: 'text', icon: <FontAwesomeIcon icon="fas fa-font" className="tool-icon" size={18} />, label: 'Text' },
    { id: 'image', icon: <FontAwesomeIcon icon="far fa-image" className="tool-icon" size={18} />, label: 'Image' },
    { id: 'line', icon: <FontAwesomeIcon icon="fas fa-minus" className="tool-icon" size={18} />, label: 'Line' },
    { id: 'wall', icon: <FontAwesomeIcon icon="fas fa-border-all" className="tool-icon" size={18} />, label: 'Wall' },
    { id: 'door', icon: <FontAwesomeIcon icon="fas fa-door-open" className="tool-icon" size={18} />, label: 'Door' },
    { id: 'furniture', icon: <FontAwesomeIcon icon="fas fa-couch" className="tool-icon" size={18} />, label: 'Furniture' },
    { id: 'plant', icon: <FontAwesomeIcon icon="fas fa-seedling" className="tool-icon" size={18} />, label: 'Plant' },
    
    // Meeting / Conference Room
    { id: 'meeting-room', icon: <FontAwesomeIcon icon="fas fa-users" className="tool-icon" size={18} />, label: 'Meeting Room' },
    
    // Family / Family Services
    { id: 'family-services', icon: <FontAwesomeIcon icon="fas fa-baby" className="tool-icon" size={18} />, label: 'Family Services' },
    
    // Car / Transportation
    { id: 'transportation', icon: <FontAwesomeIcon icon="fas fa-car" className="tool-icon" size={18} />, label: 'Transportation' },
    
    // No Smoking
    { id: 'no-smoking', icon: <FontAwesomeIcon icon="fas fa-smoking-ban" className="tool-icon" size={18} />, label: 'No Smoking' },
    
    // Restaurant / Dining
    { id: 'restaurant', icon: <FontAwesomeIcon icon="fas fa-utensils" className="tool-icon" size={18} />, label: 'Restaurant' },
    
    // Information / Help Desk
    { id: 'information', icon: <FontAwesomeIcon icon="fas fa-info-circle" className="tool-icon" size={18} />, label: 'Information' },
    
    // Cafeteria / Food Service
    { id: 'cafeteria', icon: <FontAwesomeIcon icon="fas fa-coffee" className="tool-icon" size={18} />, label: 'Cafeteria' },
    
    // ATM / Banking Services
    { id: 'atm', icon: <FontAwesomeIcon icon="fas fa-credit-card" className="tool-icon" size={18} />, label: 'ATM' },
    
    // Elevator
    { id: 'elevator', icon: <FontAwesomeIcon icon="fas fa-elevator" className="tool-icon" size={18} />, label: 'Elevator' },
    
    // Emergency Exit
    { id: 'emergency-exit', icon: <FontAwesomeIcon icon="fas fa-door-open" className="tool-icon" size={18} />, label: 'Emergency Exit' },
    
    // Doctor / Medical Services
    { id: 'medical', icon: <FontAwesomeIcon icon="fas fa-stethoscope" className="tool-icon" size={18} />, label: 'Medical' },
    
    // Childcare / Family Room
    { id: 'childcare', icon: <FontAwesomeIcon icon="fas fa-child" className="tool-icon" size={18} />, label: 'Childcare' },
    
    // Nursing Room / Mother and Baby Room
    { id: 'nursing-room', icon: <FontAwesomeIcon icon="fas fa-baby-carriage" className="tool-icon" size={18} />, label: 'Nursing Room' },
    
    // Senior Citizen / Elderly Assistance
    { id: 'senior-assistance', icon: <FontAwesomeIcon icon="fas fa-walking-cane" className="tool-icon" size={18} />, label: 'Senior Assistance' },
    
    // Accessible / Wheelchair Accessible
    { id: 'wheelchair-accessible', icon: <FontAwesomeIcon icon="fas fa-wheelchair" className="tool-icon" size={18} />, label: 'Wheelchair Accessible' },
    
    // Lost and Found
    { id: 'lost-found', icon: <FontAwesomeIcon icon="fas fa-search" className="tool-icon" size={18} />, label: 'Lost & Found' },
    
    // Information Point
    { id: 'info-point', icon: <FontAwesomeIcon icon="fas fa-question-circle" className="tool-icon" size={18} />, label: 'Info Point' },
    
    // First Aid / Medical Assistance
    { id: 'first-aid', icon: <FontAwesomeIcon icon="fas fa-first-aid" className="tool-icon" size={18} />, label: 'First Aid' },
    
    // Restroom (All Gender or Male and Female)
    { id: 'restroom', icon: <FontAwesomeIcon icon="fas fa-restroom" className="tool-icon" size={18} />, label: 'Restroom' },
    
    // Men’s Restroom
    { id: 'mens-restroom', icon: <FontAwesomeIcon icon="fas fa-mars" className="tool-icon" size={18} />, label: "Men's Restroom" },
    
    // Women’s Restroom
    { id: 'womens-restroom', icon: <FontAwesomeIcon icon="fas fa-venus" className="tool-icon" size={18} />, label: "Women's Restroom" },
    
    // Luggage / Baggage Services
    { id: 'baggage', icon: <FontAwesomeIcon icon="fas fa-suitcase" className="tool-icon" size={18} />, label: 'Baggage' }
  ];
  
  const actions: ActionItem[] = [
    { 
      id: 'duplicate', 
      icon: <FontAwesomeIcon icon="fas fa-copy" size={18} />, 
      label: 'Duplicate', 
      action: () => duplicateElements(selectedIds),
      disabled: !hasSelection
    },
    { 
      id: 'delete', 
      icon: <FontAwesomeIcon icon="fas fa-trash" size={18} />, 
      label: 'Delete', 
      action: () => deleteElements(selectedIds),
      disabled: !hasSelection
    },
    { 
      id: 'bringForward', 
      icon: <FontAwesomeIcon icon="fas fa-chevron-up" size={18} />, 
      label: 'Bring Forward', 
      action: () => bringForward(selectedIds),
      disabled: !hasSelection
    },
    { 
      id: 'sendBackward', 
      icon: <FontAwesomeIcon icon="fas fa-chevron-down" size={18} />, 
      label: 'Send Backward', 
      action: () => sendBackward(selectedIds),
      disabled: !hasSelection
    },
    { 
      id: 'bringToFront', 
      icon: <FontAwesomeIcon icon="fas fa-angle-double-up" size={18} />, 
      label: 'Bring to Front', 
      action: () => bringToFront(selectedIds),
      disabled: !hasSelection
    },
    { 
      id: 'sendToBack', 
      icon: <FontAwesomeIcon icon="fas fa-angle-double-down" size={18} />, 
      label: 'Send to Back', 
      action: () => sendToBack(selectedIds),
      disabled: !hasSelection
    }
  ];

  // Group tools into categories for better organization
  const basicTools = tools.slice(0, 11); // First 11 tools are basic elements
  const facilityTools = [
    tools.find(t => t.id === 'meeting-room'),
    tools.find(t => t.id === 'restaurant'),
    tools.find(t => t.id === 'information'),
    tools.find(t => t.id === 'cafeteria'),
    tools.find(t => t.id === 'atm'),
    tools.find(t => t.id === 'elevator'),
    tools.find(t => t.id === 'restroom'),
    tools.find(t => t.id === 'mens-restroom'),
    tools.find(t => t.id === 'womens-restroom'),
  ].filter((tool): tool is ToolItem => Boolean(tool));
  
  const serviceTools = [
    tools.find(t => t.id === 'family-services'),
    tools.find(t => t.id === 'medical'),
    tools.find(t => t.id === 'childcare'),
    tools.find(t => t.id === 'nursing-room'),
    tools.find(t => t.id === 'senior-assistance'),
    tools.find(t => t.id === 'wheelchair-accessible'),
    tools.find(t => t.id === 'lost-found'),
    tools.find(t => t.id === 'info-point'),
    tools.find(t => t.id === 'first-aid'),
    tools.find(t => t.id === 'baggage'),
  ].filter((tool): tool is ToolItem => Boolean(tool));
  
  const specialTools = [
    tools.find(t => t.id === 'transportation'),
    tools.find(t => t.id === 'no-smoking'),
    tools.find(t => t.id === 'emergency-exit'),
  ].filter((tool): tool is ToolItem => Boolean(tool));

  // Add className to all icons for consistent styling
  const addToolIconClass = (toolList: ToolItem[]): ToolItem[] => {
    return toolList.map(tool => ({
      ...tool,
      icon: React.cloneElement(tool.icon, { 
        className: tool.icon.props.className || "tool-icon" 
      })
    }));
  };

  const enhancedBasicTools = addToolIconClass(basicTools);
  const enhancedFacilityTools = addToolIconClass(facilityTools);
  const enhancedServiceTools = addToolIconClass(serviceTools);
  const enhancedSpecialTools = addToolIconClass(specialTools);

  // Function to render a tool item
  const renderToolItem = (tool: ToolItem): JSX.Element => (
    <div
      key={tool.id}
      className={`tool-item ${activeTool === tool.id ? 'active' : ''}`}
      onClick={() => setActiveTool(tool.id)}
      title={tool.label}
      draggable="true"
      onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('text/plain', tool.id);
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <div className="flex items-center">
        {tool.icon}
        <span className="ml-3">{tool.label}</span>
      </div>
    </div>
  );

  // Function to render a category of tools
  const renderToolCategory = (title: string, toolsList: ToolItem[]): JSX.Element => (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="space-y-1">
        {toolsList.map(renderToolItem)}
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow-md overflow-y-auto max-h-[calc(100vh-120px)]">
      <h2 className="text-lg font-semibold mb-4">Tools</h2>
      
      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
        <div className="font-medium mb-1">✨ Enhanced Icons & Tools:</div>
        <div className="space-y-1 text-xs">
          <div>• 🎯 Icons auto-scale with element size</div>
          <div>• 👁️ Preview shapes show icons while drawing</div>
          <div>• 🖱️ Click a tool then drag on canvas to create</div>
          <div>• ✋ Use Select tool to move elements freely</div>
          <div>• 🔧 Resize elements to see icons adapt</div>
          <div>• 📏 Larger elements show more details</div>
        </div>
      </div>
      
      <div className="space-y-2">
        {/* Basic Elements */}
        {renderToolCategory('Basic Elements', enhancedBasicTools)}
        
        {/* Facilities */}
        {renderToolCategory('Facilities', enhancedFacilityTools)}
        
        {/* Services */}
        {renderToolCategory('Services', enhancedServiceTools)}
        
        {/* Special Areas */}
        {renderToolCategory('Special Areas', enhancedSpecialTools)}
        
        <hr className="my-3 border-gray-200" />
        
        {/* Action buttons */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Actions</h3>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => deleteElements(selectedIds)}
              disabled={!hasSelection}
              className="p-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete selected elements"
            >
              <FontAwesomeIcon icon="fas fa-trash" size={16} />
            </button>
            <button
              onClick={() => duplicateElements(selectedIds)}
              disabled={!hasSelection}
              className="p-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Duplicate selected elements"
            >
              <FontAwesomeIcon icon="fas fa-copy" size={16} />
            </button>
            <button
              onClick={() => bringForward(selectedIds)}
              disabled={!hasSelection}
              className="p-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Bring forward"
            >
              <FontAwesomeIcon icon="fas fa-chevron-up" size={16} />
            </button>
            <button
              onClick={() => sendBackward(selectedIds)}
              disabled={!hasSelection}
              className="p-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send backward"
            >
              <FontAwesomeIcon icon="fas fa-chevron-down" size={16} />
            </button>
            <button
              onClick={() => bringToFront(selectedIds)}
              disabled={!hasSelection}
              className="p-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Bring to front"
            >
              <FontAwesomeIcon icon="fas fa-angle-double-up" size={16} />
            </button>
            <button
              onClick={(e) => sendToBack(selectedIds)}
              disabled={!hasSelection}
              className="p-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send to back"
            >
              <FontAwesomeIcon icon="fas fa-angle-double-down" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};