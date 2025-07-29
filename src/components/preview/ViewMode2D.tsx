import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import { useCanvasStore } from '../../store/canvasStore';
import { usePathFinding } from '../../hooks/usePathFinding';
import { ElementRenderer } from '../canvas/ElementRenderer';
import { CanvasGrid } from '../canvas/CanvasGrid';
import { BackgroundImage } from '../canvas/BackgroundImage';
import { PathRenderer } from '../canvas/PathRenderer';
import { PathControls } from '../canvas/PathControls';
import { PathSelector } from '../canvas/PathSelector';

interface ViewMode2DProps {
  onBoothClick: (boothId: string) => void;
  selectedBoothId?: string;
}

export const ViewMode2D: React.FC<ViewMode2DProps> = ({ onBoothClick, selectedBoothId }) => {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    elements,
    grid,
    zoom,
    offset,
    canvasSize,
    backgroundImage,
    setZoom,
    setOffset
  } = useCanvasStore();

  // Use the path finding hook
  const {
    startBoothId,
    endBoothId,
    pathMode,
    pathPoints,
    togglePathMode,
    clearPath,
    handleBoothSelect,
    selectStartBooth,
    selectEndBooth
  } = usePathFinding(grid.size);

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if the event target is an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }
      
      // Toggle path mode with 'P' key
      if (e.key === 'p' || e.key === 'P') {
        togglePathMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePathMode]);

  // Handle wheel for zooming
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointerPos.x - offset.x) / zoom,
      y: (pointerPos.y - offset.y) / zoom
    };
    
    // Calculate new zoom
    const scaleBy = 1.1;
    const newZoom = e.evt.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
    const limitedZoom = Math.max(0.1, Math.min(5, newZoom));
    
    // Calculate new offset to zoom into mouse position
    const newOffset = {
      x: pointerPos.x - mousePointTo.x * limitedZoom,
      y: pointerPos.y - mousePointTo.y * limitedZoom
    };
    
    setZoom(limitedZoom);
    setOffset(newOffset.x, newOffset.y);
  };

  // Handle element click
  const handleElementClick = (e: any) => {
    const id = e.target.id();
    const clickedElement = elements.find(element => element.id === id);
    
    if (clickedElement && clickedElement.type === 'booth') {
      if (pathMode) {
        // In path mode, handle booth selection for pathfinding
        handleBoothSelect(id);
      } else {
        // Normal booth click behavior
        onBoothClick(id);
      }
    }
  };

  // Handle drag for panning
  const handleDragStart = () => {
    // Just to enable dragging
  };

  const handleDragMove = (e: any) => {
    setOffset(e.target.x(), e.target.y());
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      {stageSize.width > 0 && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onWheel={handleWheel}
          onClick={handleElementClick}
          draggable
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
        >
          <Layer>
            {/* Background */}
            {backgroundImage && (
              <BackgroundImage
                settings={backgroundImage}
              />
            )}
            
            {/* Grid */}
            {grid.enabled && (
              <CanvasGrid
                enabled={grid.enabled}
                size={grid.size}
                width={canvasSize.width}
                height={canvasSize.height}
                opacity={grid.opacity}
              />
            )}
            
            {/* Elements */}
            <Group
              x={offset.x}
              y={offset.y}
              scaleX={zoom}
              scaleY={zoom}
            >
              {elements
                .sort((a, b) => a.layer - b.layer)
                .map(element => (
                  <ElementRenderer
                    key={element.id}
                    element={element}
                    isSelected={element.id === selectedBoothId}
                    snapToGrid={false}
                    gridSize={grid.size}
                  />
                ))}
                
              {/* Path Renderer */}
              {pathMode && pathPoints.length > 0 && (
                <PathRenderer pathPoints={pathPoints} />
              )}
            </Group>
          </Layer>
        </Stage>
      )}
      
      {/* Path Controls */}
      {stageSize.width > 0 && (
        <div className="absolute bottom-4 right-4 z-10">
          <PathControls
            pathMode={pathMode}
            startBoothId={startBoothId}
            endBoothId={endBoothId}
            togglePathMode={togglePathMode}
            clearPath={clearPath}
            selectStartBooth={selectStartBooth}
            selectEndBooth={selectEndBooth}
          />
        </div>
      )}
    </div>
  );
};