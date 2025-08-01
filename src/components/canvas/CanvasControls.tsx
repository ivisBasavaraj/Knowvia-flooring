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
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 glass-panel p-3 flex items-center space-x-3">
      <button
        onClick={handleZoomOut}
        className="glass-button p-3 rounded-lg transition-all duration-200 hover:scale-105"
        title="Zoom Out"
      >
        <FontAwesomeIcon icon="fas fa-search-minus" size={20} />
      </button>
      
      <div className="px-3 min-w-16 text-center font-semibold text-gray-700">
        {Math.round(zoom * 100)}%
      </div>
      
      <button
        onClick={handleZoomIn}
        className="glass-button p-3 rounded-lg transition-all duration-200 hover:scale-105"
        title="Zoom In"
      >
        <FontAwesomeIcon icon="fas fa-search-plus" size={20} />
      </button>
      
      <button
        onClick={handleResetZoom}
        className="glass-button p-3 rounded-lg transition-all duration-200 hover:scale-105"
        title="Reset Zoom"
      >
        <FontAwesomeIcon icon="fas fa-expand" size={20} />
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-2"></div>
      
      <button
        onClick={handleToggleGrid}
        className={`glass-button p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
          grid.enabled ? 'bg-purple-100 text-purple-600' : ''
        }`}
        title="Toggle Grid"
      >
        <FontAwesomeIcon icon="fas fa-th" size={20} />
      </button>
      
      <button
        onClick={handleToggleSnap}
        className={`glass-button p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
          grid.snap ? 'bg-purple-100 text-purple-600' : ''
        }`}
        title="Toggle Snap to Grid"
      >
        <FontAwesomeIcon icon="fas fa-magnet" size={20} />
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-2"></div>
      
      <button
        onClick={handleSave}
        className="glass-button p-3 rounded-lg transition-all duration-200 hover:scale-105"
        title="Save Floor Plan"
      >
        <FontAwesomeIcon icon="fas fa-save" size={20} />
      </button>
      
      <button
        onClick={handleExport}
        className="glass-button p-3 rounded-lg transition-all duration-200 hover:scale-105"
        title="Export Floor Plan"
      >
        <FontAwesomeIcon icon="fas fa-download" size={20} />
      </button>
    </div>
  );
};