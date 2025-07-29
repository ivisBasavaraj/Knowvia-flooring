import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { usePathFinding } from '../../hooks/usePathFinding';
import { BoothElement, ShapeElement, FurnitureElement, DoorElement, PlantElement } from '../../types/canvas';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PathControls } from '../canvas/PathControls';

interface ViewMode3DProps {
  onBoothClick: (boothId: string) => void;
  selectedBoothId?: string;
}

export const ViewMode3D: React.FC<ViewMode3DProps> = ({ onBoothClick, selectedBoothId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { elements, grid } = useCanvasStore();
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  // Store booth data for click handling
  const [boothPositions, setBoothPositions] = useState<{[id: string]: {x: number, y: number, width: number, height: number}}>({});
  
  // Reference to the path line
  const pathLineRef = useRef<THREE.Line | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Basic Three.js setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 500, 700); // Increased height and distance for better overview
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased intensity
    scene.add(ambientLight);
    
    // Main directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 400, 300);
    directionalLight.castShadow = true;
    
    // Configure shadow properties for better quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 1500;
    directionalLight.shadow.camera.left = -700;
    directionalLight.shadow.camera.right = 700;
    directionalLight.shadow.camera.top = 700;
    directionalLight.shadow.camera.bottom = -700;
    
    scene.add(directionalLight);
    
    // Add secondary lights for better illumination
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-200, 200, -300);
    scene.add(backLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-200, 200, 300);
    scene.add(fillLight);
    
    // Add floor
    const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xeeeeee,
      roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(1000, 100);
    scene.add(gridHelper);
    
    // Store positions for click handling
    const positions: {[id: string]: {x: number, y: number, width: number, height: number}} = {};
    
    // Sort elements by layer to ensure proper rendering
    const sortedElements = [...elements].sort((a, b) => a.layer - b.layer);
    
    // Helper function to convert CSS color to THREE.js color
    const getThreeColor = (cssColor: string) => {
      // Default color if parsing fails
      let color = new THREE.Color(0xcccccc);
      
      try {
        // Handle rgba colors
        if (cssColor.startsWith('rgba')) {
          const rgba = cssColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (rgba) {
            color = new THREE.Color(
              parseInt(rgba[1]) / 255,
              parseInt(rgba[2]) / 255,
              parseInt(rgba[3]) / 255
            );
          }
        } 
        // Handle hex and other color formats
        else {
          color = new THREE.Color(cssColor);
        }
      } catch (e) {
        console.error('Error parsing color:', cssColor);
      }
      
      return color;
    };
    
    // Create 3D elements
    sortedElements.forEach((element) => {
      // Calculate base position
      const posX = element.x - 500 + element.width / 2;
      const posZ = element.y - 500 + element.height / 2;
      
      // Store position for click detection
      positions[element.id] = {
        x: posX,
        y: posZ,
        width: element.width,
        height: element.height
      };
      
      let mesh: THREE.Mesh | null = null;
      
      // Handle different element types
      switch (element.type) {
        case 'booth': {
          const booth = element as BoothElement;
          // Create booth mesh
          const boothGeometry = new THREE.BoxGeometry(booth.width, 40, booth.height);
          
          // Determine color based on booth status and selection
          let color;
          let isSelected = selectedBoothId === booth.id;
          
          if (isSelected) {
            color = 0xffeb3b; // Bright yellow for selected booth
          } else {
            switch (booth.status) {
              case 'available':
                color = 0x4caf50; // Green
                break;
              case 'reserved':
                color = 0xff9800; // Orange
                break;
              case 'sold':
                color = 0xf44336; // Red
                break;
              case 'on-hold':
                color = 0x2196f3; // Blue
                break;
              default:
                color = 0xffffff; // White
            }
          }
          
          const boothMaterial = new THREE.MeshStandardMaterial({
            color,
            transparent: true,
            opacity: isSelected ? 1.0 : 0.8,
            emissive: isSelected ? 0x444400 : 0x000000, // Add glow effect for selected booth
          });
          
          mesh = new THREE.Mesh(boothGeometry, boothMaterial);
          mesh.position.set(posX, 20, posZ);
          
          // Add booth number as a 3D text
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = 100;
          canvas.height = 50;
          
          if (context) {
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = 'bold 30px Arial';
            context.fillStyle = 'black';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(booth.number, canvas.width / 2, canvas.height / 2);
            
            const texture = new THREE.CanvasTexture(canvas);
            const labelMaterial = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              side: THREE.DoubleSide
            });
            
            const labelGeometry = new THREE.PlaneGeometry(booth.width * 0.8, booth.width * 0.4);
            const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
            labelMesh.position.set(0, 21, 0);
            labelMesh.rotation.x = -Math.PI / 2;
            
            mesh.add(labelMesh);
          }
          break;
        }
        
        case 'shape': {
          const shape = element as ShapeElement;
          
          if (shape.shapeType === 'rectangle') {
            // Create wall or rectangle
            const wallGeometry = new THREE.BoxGeometry(shape.width, 60, shape.height);
            const wallMaterial = new THREE.MeshStandardMaterial({
              color: getThreeColor(shape.fill),
              transparent: shape.fill.includes('rgba'),
              opacity: shape.fill.includes('rgba') ? 0.8 : 1,
            });
            
            mesh = new THREE.Mesh(wallGeometry, wallMaterial);
            mesh.position.set(posX, 30, posZ);
          } else if (shape.shapeType === 'line') {
            // Create line
            const points = [];
            points.push(new THREE.Vector3(posX - shape.width/2, 1, posZ - shape.height/2));
            points.push(new THREE.Vector3(posX + shape.width/2, 1, posZ + shape.height/2));
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({ 
              color: getThreeColor(shape.stroke),
              linewidth: shape.strokeWidth
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(line);
          }
          break;
        }
        
        case 'furniture': {
          const furniture = element as FurnitureElement;
          // Create furniture mesh
          const furnitureGeometry = new THREE.BoxGeometry(furniture.width, 30, furniture.height);
          const furnitureMaterial = new THREE.MeshStandardMaterial({
            color: getThreeColor(furniture.fill),
            transparent: furniture.fill.includes('rgba'),
            opacity: furniture.fill.includes('rgba') ? 0.7 : 1,
          });
          
          mesh = new THREE.Mesh(furnitureGeometry, furnitureMaterial);
          mesh.position.set(posX, 15, posZ);
          
          // Add label for furniture type
          if (furniture.furnitureType) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 50;
            
            if (context) {
              context.fillStyle = 'white';
              context.fillRect(0, 0, canvas.width, canvas.height);
              context.font = 'bold 20px Arial';
              context.fillStyle = 'black';
              context.textAlign = 'center';
              context.textBaseline = 'middle';
              context.fillText(furniture.furnitureType, canvas.width / 2, canvas.height / 2);
              
              const texture = new THREE.CanvasTexture(canvas);
              const labelMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
              });
              
              const labelGeometry = new THREE.PlaneGeometry(furniture.width * 0.8, furniture.width * 0.4);
              const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
              labelMesh.position.set(0, 16, 0);
              labelMesh.rotation.x = -Math.PI / 2;
              
              mesh.add(labelMesh);
            }
          }
          break;
        }
        
        case 'door': {
          const door = element as DoorElement;
          // Create door mesh
          const doorGeometry = new THREE.BoxGeometry(door.width, 40, door.height);
          const doorMaterial = new THREE.MeshStandardMaterial({
            color: getThreeColor(door.fill),
            transparent: door.fill.includes('rgba'),
            opacity: door.fill.includes('rgba') ? 0.8 : 1,
          });
          
          mesh = new THREE.Mesh(doorGeometry, doorMaterial);
          mesh.position.set(posX, 20, posZ);
          
          // Add arrow to indicate door direction
          const arrowLength = door.width * 0.8;
          const arrowGeometry = new THREE.BoxGeometry(arrowLength, 2, 5);
          const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
          const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
          arrow.position.set(0, 21, 0);
          
          // Rotate arrow based on door direction
          if (door.direction === 'right') {
            arrow.rotation.y = 0;
          } else if (door.direction === 'left') {
            arrow.rotation.y = Math.PI;
          } else if (door.direction === 'up') {
            arrow.rotation.y = -Math.PI / 2;
          } else if (door.direction === 'down') {
            arrow.rotation.y = Math.PI / 2;
          }
          
          mesh.add(arrow);
          break;
        }
        
        case 'plant': {
          const plant = element as PlantElement;
          // Create plant mesh (cylinder for pot, sphere for foliage)
          const potGeometry = new THREE.CylinderGeometry(plant.width/4, plant.width/3, 10, 16);
          const potMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
          const pot = new THREE.Mesh(potGeometry, potMaterial);
          
          const foliageGeometry = new THREE.SphereGeometry(plant.width/2, 16, 16);
          const foliageMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x228B22,
            roughness: 0.8
          });
          const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
          foliage.position.set(0, 15, 0);
          
          // Create a group to hold both parts
          const plantGroup = new THREE.Group();
          plantGroup.add(pot);
          plantGroup.add(foliage);
          plantGroup.position.set(posX, 5, posZ);
          
          scene.add(plantGroup);
          break;
        }
      }
      
      // Add mesh to scene if created
      if (mesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
      }
    });
    
    // Store booth positions
    setBoothPositions(positions);
    
    // Handle click events
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Calculate mouse position in normalized device coordinates
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        // Find the closest element to the intersection point
        const point = intersects[0].point;
        
        // Check if the point is inside any element
        for (const [id, position] of Object.entries(positions)) {
          const halfWidth = position.width / 2;
          const halfHeight = position.height / 2;
          
          if (
            point.x >= position.x - halfWidth &&
            point.x <= position.x + halfWidth &&
            point.z >= position.y - halfHeight &&
            point.z <= position.y + halfHeight
          ) {
            const clickedElement = elements.find(element => element.id === id);
            
            if (clickedElement) {
              if (pathMode && clickedElement.type === 'booth') {
                // In path mode, handle booth selection for pathfinding
                handleBoothSelect(id);
                
                // Update the 3D path visualization
                updatePathVisualization();
              } else {
                // Normal click behavior - only show info for booths
                if (clickedElement.type === 'booth') {
                  onBoothClick(id);
                }
              }
            }
            break;
          }
        }
      }
    };
    
    // Function to update the path visualization in 3D
    const updatePathVisualization = () => {
      // Remove existing path line if it exists
      if (pathLineRef.current && sceneRef.current) {
        sceneRef.current.remove(pathLineRef.current);
        pathLineRef.current = null;
      }
      
      // If we don't have enough path points, don't render anything
      if (pathPoints.length < 4) return;
      
      // Create a new path line
      const points = [];
      
      // Convert 2D path points to 3D points
      for (let i = 0; i < pathPoints.length; i += 2) {
        const x = pathPoints[i] - 500;
        const z = pathPoints[i + 1] - 500;
        points.push(new THREE.Vector3(x, 25, z)); // Slightly above the floor
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        linewidth: 3
      });
      
      pathLineRef.current = new THREE.Line(geometry, material);
      sceneRef.current?.add(pathLineRef.current);
    };
    
    containerRef.current.addEventListener('click', handleClick);
    
    // Add keyboard shortcut for path mode
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
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    setIsLoading(false);
    
    // Update path visualization when path points change
    if (pathPoints.length > 0) {
      updatePathVisualization();
    }
    
    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClick);
        containerRef.current.removeChild(renderer.domElement);
      }
      
      window.removeEventListener('keydown', handleKeyDown);
      
      // Dispose resources
      renderer.dispose();
    };
  }, [elements, onBoothClick, pathMode, handleBoothSelect, selectedBoothId]);
  
  // Effect to update path visualization when path points change
  useEffect(() => {
    // This effect will run outside the main Three.js setup
    // We need to make sure we have a scene and path points
    if (sceneRef.current && pathPoints.length > 0) {
      // Remove existing path line if it exists
      if (pathLineRef.current) {
        sceneRef.current.remove(pathLineRef.current);
        pathLineRef.current = null;
      }
      
      // Create a new path line
      const points = [];
      
      // Convert 2D path points to 3D points
      for (let i = 0; i < pathPoints.length; i += 2) {
        const x = pathPoints[i] - 500;
        const z = pathPoints[i + 1] - 500;
        points.push(new THREE.Vector3(x, 25, z)); // Slightly above the floor
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        linewidth: 3
      });
      
      pathLineRef.current = new THREE.Line(geometry, material);
      sceneRef.current.add(pathLineRef.current);
    }
  }, [pathPoints]);
  
  return (
    <div ref={containerRef} className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading 3D view...</p>
          </div>
        </div>
      )}
      
      {/* Legend */}
      {!isLoading && (
        <div className="absolute top-4 left-4 bg-white p-2 rounded-md shadow-md z-10 text-xs">
          <h3 className="font-bold mb-1 text-sm">Legend</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 mr-1"></div>
              <span>Available Booth</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 mr-1"></div>
              <span>Reserved Booth</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 mr-1"></div>
              <span>Sold Booth</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 mr-1"></div>
              <span>On-Hold Booth</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-700 mr-1"></div>
              <span>Wall</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 mr-1"></div>
              <span>Furniture</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Path Controls */}
      {!isLoading && (
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
      
      {/* Camera Controls Help */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow-md z-10 text-xs">
          <h3 className="font-bold mb-1 text-sm">Controls</h3>
          <ul className="list-disc pl-4">
            <li>Left-click + drag: Rotate view</li>
            <li>Right-click + drag: Pan view</li>
            <li>Scroll: Zoom in/out</li>
            <li>Click on booth: View details</li>
          </ul>
        </div>
      )}
    </div>
  );
};