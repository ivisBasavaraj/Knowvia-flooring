import React from 'react';
import { Group, Path, Text } from 'react-konva';

// Enhanced Font Awesome SVG paths that match the actual Font Awesome icons more closely
export const EnhancedFontAwesomeIconPaths: { [key: string]: string } = {
  // Basic tools - more accurate paths
  'fas fa-mouse-pointer': "M3,1 L3,17 L7.5,12.5 L11,15 L13,11 L9.5,8.5 L13,5 Z",
  'fas fa-th-large': "M1,1 L11,1 L11,11 L1,11 Z M13,1 L23,1 L23,11 L13,11 Z M1,13 L11,13 L11,23 L1,23 Z M13,13 L23,13 L23,23 L13,23 Z",
  'far fa-square': "M3,3 L21,3 L21,21 L3,21 Z M5,5 L19,5 L19,19 L5,19 Z",
  'far fa-circle': "M12,1 C18.1,1 23,5.9 23,12 C23,18.1 18.1,23 12,23 C5.9,23 1,18.1 1,12 C1,5.9 5.9,1 12,1 M12,3 C7,3 3,7 3,12 C3,17 7,21 12,21 C17,21 21,17 21,12 C21,7 17,3 12,3",
  'fas fa-font': "M7,3 L17,3 L17,5 L15,5 L15,19 L17,19 L17,21 L7,21 L7,19 L9,19 L9,5 L7,5 Z M11,7 L13,7 L13,17 L11,17 Z",
  'far fa-image': "M3,3 L21,3 L21,21 L3,21 Z M5,5 L19,5 L19,19 L5,19 Z M7,7 C7.6,7 8,7.4 8,8 C8,8.6 7.6,9 7,9 C6.4,9 6,8.6 6,8 C6,7.4 6.4,7 7,7 M5,17 L9,13 L13,17 L17,13 L19,15 L19,17 Z",
  'fas fa-minus': "M3,11 L21,11 L21,13 L3,13 Z",
  'fas fa-border-all': "M3,3 L21,3 L21,21 L3,21 Z M3,12 L21,12 M12,3 L12,21",
  'fas fa-door-open': "M5,3 L19,3 L19,21 L5,21 Z M7,5 L17,5 L17,19 L7,19 Z M15,11 C15.6,11 16,11.4 16,12 C16,12.6 15.6,13 15,13 C14.4,13 14,12.6 14,12 C14,11.4 14.4,11 15,11",
  'fas fa-couch': "M3,9 L21,9 L21,17 L19,17 L19,19 L17,19 L17,17 L7,17 L7,19 L5,19 L5,17 L3,17 Z M5,7 L19,7 L19,9 L5,9 Z M2,7 C1.4,7 1,7.4 1,8 L1,16 C1,16.6 1.4,17 2,17 M22,7 C22.6,7 23,7.4 23,8 L23,16 C23,16.6 22.6,17 22,17",
  'fas fa-seedling': "M12,21 L12,13 C12,9 8,9 8,9 C8,9 12,9 12,5 C12,5 16,5 16,9 C16,9 12,9 12,13 L12,21 M10,21 L14,21",
  
  // Meeting and services - enhanced paths
  'fas fa-users': "M8,9 C9.7,9 11,7.7 11,6 C11,4.3 9.7,3 8,3 C6.3,3 5,4.3 5,6 C5,7.7 6.3,9 8,9 M16,9 C17.7,9 19,7.7 19,6 C19,4.3 17.7,3 16,3 C14.3,3 13,4.3 13,6 C13,7.7 14.3,9 16,9 M8,11 C4.7,11 2,13.7 2,17 L2,19 L14,19 L14,17 C14,13.7 11.3,11 8,11 M16,11 C12.7,11 10,13.7 10,17 L10,19 L22,19 L22,17 C22,13.7 19.3,11 16,11",
  'fas fa-baby': "M12,3 C13.7,3 15,4.3 15,6 C15,7.7 13.7,9 12,9 C10.3,9 9,7.7 9,6 C9,4.3 10.3,3 12,3 M12,11 C13.7,11 15,12.3 15,14 L15,18 L13,18 L13,21 L11,21 L11,18 L9,18 L9,14 C9,12.3 10.3,11 12,11",
  'fas fa-car': "M5,11 L19,11 L20,15 L18,15 C18,16.7 16.7,18 15,18 C13.3,18 12,16.7 12,15 L10,15 C10,16.7 8.7,18 7,18 C5.3,18 4,16.7 4,15 L2,15 Z M6,9 L18,9 L19,11 L5,11 Z M7,13 C7.6,13 8,13.4 8,14 C8,14.6 7.6,15 7,15 C6.4,15 6,14.6 6,14 C6,13.4 6.4,13 7,13 M17,13 C17.6,13 18,13.4 18,14 C18,14.6 17.6,15 17,15 C16.4,15 16,14.6 16,14 C16,13.4 16.4,13 17,13",
  'fas fa-smoking-ban': "M12,1 C18.1,1 23,5.9 23,12 C23,18.1 18.1,23 12,23 C5.9,23 1,18.1 1,12 C1,5.9 5.9,1 12,1 M5,5 L19,19 M7,9 L17,9 L17,15 L7,15 Z",
  'fas fa-utensils': "M7,1 L7,11 C7,12.1 7.9,13 9,13 C10.1,13 11,12.1 11,11 L11,1 M9,13 L9,23 M17,1 L17,9 L19,9 L19,23 M15,3 L15,7 M19,3 L19,7",
  'fas fa-info-circle': "M12,1 C18.1,1 23,5.9 23,12 C23,18.1 18.1,23 12,23 C5.9,23 1,18.1 1,12 C1,5.9 5.9,1 12,1 M11,6 L13,6 L13,8 L11,8 Z M11,10 L13,10 L13,18 L11,18 Z",
  'fas fa-coffee': "M5,7 L19,7 L19,17 C19,18.1 18.1,19 17,19 L7,19 C5.9,19 5,18.1 5,17 Z M19,9 L21,9 C22.1,9 23,9.9 23,11 C23,12.1 22.1,13 21,13 L19,13 M7,3 L7,5 M11,3 L11,5 M15,3 L15,5",
  'fas fa-credit-card': "M1,5 L23,5 L23,19 L1,19 Z M1,9 L23,9 M3,13 L9,13 M3,15 L7,15",
  'fas fa-elevator': "M7,3 L17,3 L17,21 L7,21 Z M9,5 L15,5 L15,19 L9,19 Z M12,7 L9,9 L15,9 Z M12,17 L9,15 L15,15 Z",
  'fas fa-stethoscope': "M7,1 C5.3,1 4,2.3 4,4 C4,5.7 5.3,7 7,7 C8.7,7 10,5.7 10,4 C10,2.3 8.7,1 7,1 M17,1 C15.3,1 14,2.3 14,4 C14,5.7 15.3,7 17,7 C18.7,7 20,5.7 20,4 C20,2.3 18.7,1 17,1 M7,7 L7,13 C7,15.8 9.2,18 12,18 C14.8,18 17,15.8 17,13 L17,7 M19,17 C20.7,17 22,18.3 22,20 C22,21.7 20.7,23 19,23 C17.3,23 16,21.7 16,20 C16,18.3 17.3,17 19,17",
  'fas fa-child': "M12,3 C13.7,3 15,4.3 15,6 C15,7.7 13.7,9 12,9 C10.3,9 9,7.7 9,6 C9,4.3 10.3,3 12,3 M12,11 C13.7,11 15,12.3 15,14 L15,18 L13,18 L13,21 L11,21 L11,18 L9,18 L9,14 C9,12.3 10.3,11 12,11",
  'fas fa-baby-carriage': "M7,13 C8.7,13 10,14.3 10,16 C10,17.7 8.7,19 7,19 C5.3,19 4,17.7 4,16 C4,14.3 5.3,13 7,13 M17,13 C18.7,13 20,14.3 20,16 C20,17.7 18.7,19 17,19 C15.3,19 14,17.7 14,16 C14,14.3 15.3,13 17,13 M3,7 L17,7 L19,11 L5,11 Z M7,3 L13,3 L13,7",
  'fas fa-walking-cane': "M17,3 C18.7,3 20,4.3 20,6 C20,7.7 18.7,9 17,9 C15.3,9 14,7.7 14,6 C14,4.3 15.3,3 17,3 M17,11 L17,17 L15,21 M11,13 L17,13 M7,21 L7,3 M5,3 L9,3",
  'fas fa-wheelchair': "M12,3 C13.7,3 15,4.3 15,6 C15,7.7 13.7,9 12,9 C10.3,9 9,7.7 9,6 C9,4.3 10.3,3 12,3 M12,11 L12,15 L7,15 L7,17 L17,17 L17,19 C19.8,19 22,21.2 22,24 C22,26.8 19.8,29 17,29 C14.2,29 12,26.8 12,24 C12,21.2 14.2,19 17,19 M7,17 L9,25 M12,15 L15,13 M5,25 C7.8,25 7.8,29 5,29 C2.2,29 2.2,25 5,25 M9,25 C11.8,25 11.8,29 9,29 C6.2,29 6.2,25 9,25",
  'fas fa-search': "M16.5,15 L21.5,20 L20,21.5 L15,16.5 C13.8,17.2 12.4,17.6 11,17.6 C7.4,17.6 4.4,14.6 4.4,11 C4.4,7.4 7.4,4.4 11,4.4 C14.6,4.4 17.6,7.4 17.6,11 C17.6,12.4 17.2,13.8 16.5,15 M11,6.4 C8.5,6.4 6.4,8.5 6.4,11 C6.4,13.5 8.5,15.6 11,15.6 C13.5,15.6 15.6,13.5 15.6,11 C15.6,8.5 13.5,6.4 11,6.4",
  'fas fa-question-circle': "M12,1 C18.1,1 23,5.9 23,12 C23,18.1 18.1,23 12,23 C5.9,23 1,18.1 1,12 C1,5.9 5.9,1 12,1 M12,5 C9.8,5 8,6.8 8,9 L10,9 C10,7.9 10.9,7 12,7 C13.1,7 14,7.9 14,9 C14,10.5 13,11 12,12.5 L12,14 L14,14 C14,12.5 15,12 15,9 C15,6.8 13.2,5 12,5 M11,16 L13,16 L13,18 L11,18 Z",
  'fas fa-first-aid': "M12,1 C18.1,1 23,5.9 23,12 C23,18.1 18.1,23 12,23 C5.9,23 1,18.1 1,12 C1,5.9 5.9,1 12,1 M9,6 L15,6 L15,9 L18,9 L18,15 L15,15 L15,18 L9,18 L9,15 L6,15 L6,9 L9,9 Z",
  'fas fa-restroom': "M7,3 C8.7,3 10,4.3 10,6 C10,7.7 8.7,9 7,9 C5.3,9 4,7.7 4,6 C4,4.3 5.3,3 7,3 M7,11 L7,17 L5,17 L5,21 L9,21 L9,17 L7,17 M17,3 C18.7,3 20,4.3 20,6 C20,7.7 18.7,9 17,9 C15.3,9 14,7.7 14,6 C14,4.3 15.3,3 17,3 M17,11 L17,15 C15,17 15,19 15,21 L19,21 C19,19 19,17 17,15 L17,11 M15,17 L19,17",
  'fas fa-mars': "M17,3 C18.7,3 20,4.3 20,6 C20,7.7 18.7,9 17,9 C15.3,9 14,7.7 14,6 C14,4.3 15.3,3 17,3 M17,11 L17,17 L15,17 L15,21 L19,21 L19,17 L17,17 M11,15 L21,15",
  'fas fa-venus': "M12,3 C13.7,3 15,4.3 15,6 C15,7.7 13.7,9 12,9 C10.3,9 9,7.7 9,6 C9,4.3 10.3,3 12,3 M12,11 L12,15 C10,17 10,19 10,21 L14,21 C14,19 14,17 12,15 L12,11 M10,17 L14,17 M12,19 L12,23",
  'fas fa-suitcase': "M7,5 L17,5 L17,7 L19,7 L19,19 L5,19 L5,7 L7,7 Z M9,3 L15,3 L15,5 L9,5 Z M7,9 L17,9 M9,11 L15,11"
};

interface FontAwesomeCanvasIconProps {
  iconName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export const FontAwesomeCanvasIcon: React.FC<FontAwesomeCanvasIconProps> = ({
  iconName,
  x,
  y,
  width,
  height,
  fill = '#333333',
  stroke,
  strokeWidth = 0
}) => {
  const iconPath = EnhancedFontAwesomeIconPaths[iconName];
  
  if (!iconPath) {
    // Fallback to a simple rectangle if icon not found
    return (
      <Path
        x={x}
        y={y}
        data="M2,2 L22,2 L22,22 L2,22 Z"
        scaleX={width / 24}
        scaleY={height / 24}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  return (
    <Path
      x={x}
      y={y}
      data={iconPath}
      scaleX={width / 24} // Normalize to 24x24 viewBox
      scaleY={height / 24}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};

// Helper function to render Font Awesome icons on canvas with better consistency
export const renderFontAwesomeIcon = (
  iconName: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color?: string,
  strokeColor?: string,
  strokeWidth?: number
): JSX.Element => {
  return (
    <FontAwesomeCanvasIcon
      iconName={iconName}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
};