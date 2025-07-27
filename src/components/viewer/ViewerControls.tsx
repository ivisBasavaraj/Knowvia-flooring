import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { ViewerMode } from '../../types/canvas';

interface ViewerControlsProps {
  onToggleView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleMiniMap: () => void;
}

export const ViewerControls: React.FC<ViewerControlsProps> = ({
  onToggleView,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleMiniMap
}) => {
  const { viewerMode, miniMapEnabled } = useCanvasStore();
  
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-50">
      <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2">
        {/* View toggle button */}
        <button
          className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
          onClick={onToggleView}
          title={viewerMode === '2d' ? 'Switch to 3D View' : 'Switch to 2D View'}
        >
          <span className="material-icons text-lg">
            {viewerMode === '2d' ? '3d_rotation' : 'view_in_ar'}
          </span>
          <span className="ml-2">{viewerMode === '2d' ? '3D' : '2D'}</span>
        </button>
        
        {/* Zoom controls */}
        <div className="flex flex-col gap-1">
          <button
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            onClick={onZoomIn}
            title="Zoom In"
          >
            <span className="material-icons">add</span>
          </button>
          
          <button
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            onClick={onZoomOut}
            title="Zoom Out"
          >
            <span className="material-icons">remove</span>
          </button>
          
          <button
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            onClick={onResetView}
            title="Reset View"
          >
            <span className="material-icons">center_focus_weak</span>
          </button>
        </div>
        
        {/* MiniMap toggle */}
        <button
          className={`p-2 rounded-md ${miniMapEnabled ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 hover:bg-gray-200'} flex items-center justify-center`}
          onClick={onToggleMiniMap}
          title={miniMapEnabled ? 'Hide Mini Map' : 'Show Mini Map'}
        >
          <span className="material-icons">map</span>
        </button>
      </div>
    </div>
  );
};