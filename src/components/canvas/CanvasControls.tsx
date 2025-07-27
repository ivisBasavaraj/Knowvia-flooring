import React from 'react';
import { FontAwesomeIcon } from '../icons/FontAwesomeIcon';
import { useCanvasStore } from '../../store/canvasStore';

export const CanvasControls: React.FC = () => {
  const { zoom, grid, setZoom, setGrid } = useCanvasStore();
  
  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 4));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.25));
  };
  
  const handleResetZoom = () => {
    setZoom(1);
  };
  
  const handleToggleGrid = () => {
    setGrid(!grid.enabled, grid.size, grid.snap);
  };
  
  const handleToggleSnap = () => {
    setGrid(grid.enabled, grid.size, !grid.snap);
  };
  
  const handleSave = () => {
    // Implementation for saving would go here
    console.log('Save floor plan');
  };
  
  const handleExport = () => {
    // Implementation for exporting would go here
    console.log('Export floor plan');
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
      <button
        onClick={handleZoomOut}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        title="Zoom Out"
      >
        <FontAwesomeIcon icon="fas fa-search-minus" size={20} />
      </button>
      
      <div className="px-2 min-w-16 text-center">
        {Math.round(zoom * 100)}%
      </div>
      
      <button
        onClick={handleZoomIn}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        title="Zoom In"
      >
        <FontAwesomeIcon icon="fas fa-search-plus" size={20} />
      </button>
      
      <button
        onClick={handleResetZoom}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        title="Reset Zoom"
      >
        <FontAwesomeIcon icon="fas fa-expand" size={20} />
      </button>
      
      <div className="w-px h-6 bg-gray-200 mx-1"></div>
      
      <button
        onClick={handleToggleGrid}
        className={`p-2 rounded-md transition-colors ${
          grid.enabled ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
        }`}
        title="Toggle Grid"
      >
        <FontAwesomeIcon icon="fas fa-th" size={20} />
      </button>
      
      <button
        onClick={handleToggleSnap}
        className={`p-2 rounded-md transition-colors ${
          grid.snap ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
        }`}
        title="Toggle Snap to Grid"
      >
        <FontAwesomeIcon icon="fas fa-magnet" size={20} />
      </button>
      
      <div className="w-px h-6 bg-gray-200 mx-1"></div>
      
      <button
        onClick={handleSave}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        title="Save Floor Plan"
      >
        <FontAwesomeIcon icon="fas fa-save" size={20} />
      </button>
      
      <button
        onClick={handleExport}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        title="Export Floor Plan"
      >
        <FontAwesomeIcon icon="fas fa-download" size={20} />
      </button>
    </div>
  );
};