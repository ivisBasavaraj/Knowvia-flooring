/**
 * Configuration file for the Interactive Floor Plan Mapping Application
 * Contains all application settings, API endpoints, and default values
 */

const CONFIG = {
  // Application Settings
  APP: {
    NAME: 'FloorPlan Mapper',
    VERSION: '2.0.0',
    DEBUG: true,
    MAX_FLOOR_PLAN_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'],
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  },

  // Map Configuration
  MAP: {
    // Default view settings
    DEFAULT_CENTER: [-74.006, 40.7128], // New York City
    DEFAULT_ZOOM: 12,
    MIN_ZOOM: 8,
    MAX_ZOOM: 20,
    
    // Map constraints
    MAX_EXTENT: [-180, -85, 180, 85], // World bounds
    
    // Tile sources
    TILE_SOURCES: {
      SATELLITE: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community'
      },
      STREET: {
        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
      },
      HYBRID: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community'
      }
    },
    
    // Animation settings
    ANIMATION_DURATION: 500,
    SMOOTH_ZOOM: true,
    
    // Interaction settings
    DOUBLE_CLICK_ZOOM: true,
    KEYBOARD_PAN: true,
    MOUSE_WHEEL_ZOOM: true,
  },

  // Area Selection Settings
  SELECTION: {
    // Drawing styles
    STROKE_COLOR: '#007bff',
    STROKE_WIDTH: 2,
    FILL_COLOR: 'rgba(0, 123, 255, 0.1)',
    
    // Hover styles
    HOVER_STROKE_COLOR: '#0056b3',
    HOVER_STROKE_WIDTH: 3,
    HOVER_FILL_COLOR: 'rgba(0, 123, 255, 0.2)',
    
    // Selection styles
    SELECTED_STROKE_COLOR: '#28a745',
    SELECTED_STROKE_WIDTH: 3,
    SELECTED_FILL_COLOR: 'rgba(40, 167, 69, 0.15)',
    
    // Minimum area size (in square meters)
    MIN_AREA_SIZE: 100,
    
    // Maximum number of selection points for polygon
    MAX_POLYGON_POINTS: 50,
    
    // Snap tolerance (in pixels)
    SNAP_TOLERANCE: 10,
  },

  // Floor Plan Settings
  FLOOR_PLANS: {
    // Default overlay settings
    DEFAULT_OPACITY: 0.8,
    DEFAULT_SCALE: 1.0,
    DEFAULT_ROTATION: 0,
    
    // Bounds and constraints
    MIN_OPACITY: 0.1,
    MAX_OPACITY: 1.0,
    MIN_SCALE: 0.1,
    MAX_SCALE: 5.0,
    
    // Layer management
    MAX_LAYERS: 10,
    DEFAULT_Z_INDEX: 100,
    
    // Auto-fit settings
    AUTO_FIT_PADDING: 50, // pixels
    AUTO_FIT_MAX_ZOOM: 18,
    
    // Supported image formats
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/svg+xml'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  },

  // UI Settings
  UI: {
    // Sidebar settings
    SIDEBAR_WIDTH: 320,
    SIDEBAR_ANIMATION_DURATION: 300,
    
    // Notification settings
    NOTIFICATION_DURATION: 5000,
    MAX_NOTIFICATIONS: 5,
    
    // Modal settings
    MODAL_ANIMATION_DURATION: 300,
    
    // Tooltip settings
    TOOLTIP_DELAY: 500,
    TOOLTIP_DURATION: 3000,
    
    // Loading settings
    MIN_LOADING_TIME: 1000,
    PROGRESS_ANIMATION_DURATION: 200,
  },

  // API Endpoints (for future backend integration)
  API: {
    BASE_URL: '/api/v1',
    ENDPOINTS: {
      GEOCODING: 'https://nominatim.openstreetmap.org/search',
      REVERSE_GEOCODING: 'https://nominatim.openstreetmap.org/reverse',
      FLOOR_PLANS: '/floor-plans',
      AREAS: '/areas',
      EXPORT: '/export',
    },
    
    // Request settings
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },

  // Predefined Locations
  LOCATIONS: [
    {
      id: 'nyc-javits',
      name: 'NYC Javits Center',
      description: 'New York, USA',
      coordinates: [-74.006, 40.7128],
      zoom: 16,
      icon: 'fas fa-building',
      category: 'convention-center'
    },
    {
      id: 'chicago-mccormick',
      name: 'McCormick Place',
      description: 'Chicago, USA',
      coordinates: [-87.6298, 41.8781],
      zoom: 16,
      icon: 'fas fa-building',
      category: 'convention-center'
    },
    {
      id: 'paris-expo',
      name: 'Paris Expo',
      description: 'Paris, France',
      coordinates: [2.3522, 48.8566],
      zoom: 16,
      icon: 'fas fa-building',
      category: 'convention-center'
    },
    {
      id: 'london-excel',
      name: 'ExCeL London',
      description: 'London, UK',
      coordinates: [-0.1276, 51.5074],
      zoom: 16,
      icon: 'fas fa-building',
      category: 'convention-center'
    },
    {
      id: 'las-vegas-convention',
      name: 'Las Vegas Convention Center',
      description: 'Las Vegas, USA',
      coordinates: [-115.1398, 36.1699],
      zoom: 16,
      icon: 'fas fa-building',
      category: 'convention-center'
    },
    {
      id: 'berlin-messe',
      name: 'Messe Berlin',
      description: 'Berlin, Germany',
      coordinates: [13.2760, 52.5015],
      zoom: 16,
      icon: 'fas fa-building',
      category: 'convention-center'
    }
  ],

  // Keyboard Shortcuts
  SHORTCUTS: {
    UNDO: ['ctrl+z', 'cmd+z'],
    REDO: ['ctrl+y', 'cmd+y', 'ctrl+shift+z', 'cmd+shift+z'],
    ESCAPE: ['escape'],
    DELETE: ['delete', 'backspace'],
    SAVE: ['ctrl+s', 'cmd+s'],
    EXPORT: ['ctrl+e', 'cmd+e'],
    HELP: ['f1', '?'],
    TOGGLE_SIDEBAR: ['ctrl+b', 'cmd+b'],
    ZOOM_IN: ['+', '='],
    ZOOM_OUT: ['-', '_'],
    FIT_VIEW: ['ctrl+0', 'cmd+0'],
  },

  // Performance Settings
  PERFORMANCE: {
    // Debounce delays (in milliseconds)
    SEARCH_DEBOUNCE: 300,
    RESIZE_DEBOUNCE: 250,
    SCROLL_DEBOUNCE: 100,
    
    // Throttle delays (in milliseconds)
    MOUSE_MOVE_THROTTLE: 16, // ~60fps
    MAP_MOVE_THROTTLE: 50,
    
    // Memory management
    MAX_CACHED_TILES: 100,
    MAX_CACHED_FLOOR_PLANS: 20,
    CLEANUP_INTERVAL: 60000, // 1 minute
    
    // Rendering optimization
    PIXEL_RATIO: Math.min(window.devicePixelRatio || 1, 2),
    RENDER_BUFFER: 100,
  },

  // Error Messages
  ERRORS: {
    MAP_LOAD_FAILED: 'Failed to load map. Please check your internet connection.',
    GEOCODING_FAILED: 'Location search is temporarily unavailable.',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB.',
    INVALID_FILE_TYPE: 'Please select a valid image file (JPG, PNG, SVG, PDF).',
    AREA_TOO_SMALL: 'Selected area is too small. Please select a larger area.',
    FLOOR_PLAN_LOAD_FAILED: 'Failed to load floor plan. Please try again.',
    EXPORT_FAILED: 'Export failed. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    BROWSER_NOT_SUPPORTED: 'Your browser is not supported. Please use a modern browser.',
  },

  // Success Messages
  SUCCESS: {
    AREA_SAVED: 'Area selection saved successfully.',
    FLOOR_PLAN_UPLOADED: 'Floor plan uploaded successfully.',
    FLOOR_PLAN_SAVED: 'Floor plan saved successfully.',
    SETTINGS_SAVED: 'Settings saved successfully.',
    EXPORT_COMPLETE: 'Export completed successfully.',
  },

  // Feature Flags
  FEATURES: {
    ENABLE_GEOCODING: true,
    ENABLE_EXPORT: true,
    ENABLE_OFFLINE_MODE: false,
    ENABLE_ANALYTICS: false,
    ENABLE_COLLABORATION: false,
    ENABLE_ADVANCED_DRAWING: true,
    ENABLE_LAYER_MANAGEMENT: true,
    ENABLE_KEYBOARD_SHORTCUTS: true,
  },

  // Development Settings
  DEV: {
    SHOW_DEBUG_INFO: true,
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    MOCK_API_RESPONSES: false,
    ENABLE_PERFORMANCE_MONITORING: true,
  }
};

// Freeze the configuration to prevent accidental modifications
Object.freeze(CONFIG);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}