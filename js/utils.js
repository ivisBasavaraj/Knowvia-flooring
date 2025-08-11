/**
 * Utility functions for the Interactive Floor Plan Mapping Application
 * Provides common functionality used across multiple modules
 */

class Utils {
  /**
   * Debounce function to limit the rate of function execution
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @param {boolean} immediate - Execute immediately on first call
   * @returns {Function} Debounced function
   */
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  /**
   * Throttle function to limit function execution frequency
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Generate a unique identifier
   * @returns {string} Unique ID
   */
  static generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Format file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format area in square meters and feet
   * @param {number} areaM2 - Area in square meters
   * @returns {object} Formatted area in both units
   */
  static formatArea(areaM2) {
    const areaFt2 = areaM2 * 10.764;
    
    let formattedM2, formattedFt2;
    
    if (areaM2 < 1000) {
      formattedM2 = `${Math.round(areaM2)} m²`;
    } else if (areaM2 < 1000000) {
      formattedM2 = `${(areaM2 / 1000).toFixed(1)} km²`;
    } else {
      formattedM2 = `${(areaM2 / 1000000).toFixed(2)} km²`;
    }
    
    if (areaFt2 < 1000) {
      formattedFt2 = `${Math.round(areaFt2)} ft²`;
    } else {
      formattedFt2 = `${(areaFt2 / 1000).toFixed(1)}k ft²`;
    }
    
    return {
      metric: formattedM2,
      imperial: formattedFt2,
      raw: areaM2
    };
  }

  /**
   * Format distance in meters and feet
   * @param {number} distanceM - Distance in meters
   * @returns {object} Formatted distance in both units
   */
  static formatDistance(distanceM) {
    const distanceFt = distanceM * 3.281;
    
    let formattedM, formattedFt;
    
    if (distanceM < 1000) {
      formattedM = `${Math.round(distanceM)} m`;
    } else {
      formattedM = `${(distanceM / 1000).toFixed(2)} km`;
    }
    
    if (distanceFt < 1000) {
      formattedFt = `${Math.round(distanceFt)} ft`;
    } else {
      formattedFt = `${(distanceFt / 5280).toFixed(2)} mi`;
    }
    
    return {
      metric: formattedM,
      imperial: formattedFt,
      raw: distanceM
    };
  }

  /**
   * Format coordinates for display
   * @param {Array} coordinates - [longitude, latitude]
   * @param {number} precision - Decimal places
   * @returns {string} Formatted coordinates
   */
  static formatCoordinates(coordinates, precision = 6) {
    if (!coordinates || coordinates.length < 2) return '0.000, 0.000';
    
    const [lon, lat] = coordinates;
    return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
  }

  /**
   * Validate file type and size
   * @param {File} file - File to validate
   * @returns {object} Validation result
   */
  static validateFile(file) {
    const result = {
      valid: true,
      errors: []
    };

    // Check file type
    if (!CONFIG.APP.SUPPORTED_FORMATS.includes(file.type)) {
      result.valid = false;
      result.errors.push(CONFIG.ERRORS.INVALID_FILE_TYPE);
    }

    // Check file size
    if (file.size > CONFIG.APP.MAX_FLOOR_PLAN_SIZE) {
      result.valid = false;
      result.errors.push(CONFIG.ERRORS.FILE_TOO_LARGE);
    }

    return result;
  }

  /**
   * Create a promise that resolves after a specified delay
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Deep clone an object
   * @param {object} obj - Object to clone
   * @returns {object} Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Check if browser supports required features
   * @returns {object} Browser support information
   */
  static checkBrowserSupport() {
    const support = {
      webgl: false,
      canvas: false,
      geolocation: false,
      fileApi: false,
      dragDrop: false,
      localStorage: false,
      all: false
    };

    try {
      // Check WebGL support
      const canvas = document.createElement('canvas');
      support.webgl = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      
      // Check Canvas support
      support.canvas = !!(canvas.getContext && canvas.getContext('2d'));
      
      // Check Geolocation API
      support.geolocation = 'geolocation' in navigator;
      
      // Check File API
      support.fileApi = !!(window.File && window.FileReader && window.FileList && window.Blob);
      
      // Check Drag and Drop API
      support.dragDrop = 'draggable' in document.createElement('div');
      
      // Check localStorage
      support.localStorage = 'localStorage' in window;
      
      // All features supported
      support.all = Object.values(support).every(feature => feature === true);
      
    } catch (error) {
      console.error('Error checking browser support:', error);
    }

    return support;
  }

  /**
   * Log messages with different levels
   * @param {string} level - Log level (debug, info, warn, error)
   * @param {string} message - Message to log
   * @param {any} data - Additional data to log
   */
  static log(level, message, data = null) {
    if (!CONFIG.APP.DEBUG) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'debug':
        if (CONFIG.DEV.LOG_LEVEL === 'debug') {
          console.debug(prefix, message, data);
        }
        break;
      case 'info':
        if (['debug', 'info'].includes(CONFIG.DEV.LOG_LEVEL)) {
          console.info(prefix, message, data);
        }
        break;
      case 'warn':
        if (['debug', 'info', 'warn'].includes(CONFIG.DEV.LOG_LEVEL)) {
          console.warn(prefix, message, data);
        }
        break;
      case 'error':
        console.error(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  }

  /**
   * Create a notification element
   * @param {string} type - Notification type (success, warning, error, info)
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @returns {HTMLElement} Notification element
   */
  static createNotification(type, title, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconMap = {
      success: 'fas fa-check-circle',
      warning: 'fas fa-exclamation-triangle',
      error: 'fas fa-times-circle',
      info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="${iconMap[type] || iconMap.info}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    return notification;
  }

  /**
   * Show a notification
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} duration - Auto-hide duration (0 = no auto-hide)
   */
  static showNotification(type, title, message, duration = CONFIG.UI.NOTIFICATION_DURATION) {
    const container = document.getElementById('notifications');
    if (!container) return;

    // Remove excess notifications
    const existing = container.querySelectorAll('.notification');
    if (existing.length >= CONFIG.UI.MAX_NOTIFICATIONS) {
      existing[0].remove();
    }

    const notification = this.createNotification(type, title, message);
    container.appendChild(notification);

    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    });

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideOutRight 0.3s ease';
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }
  }

  /**
   * Convert coordinates between different formats
   * @param {Array} coordinates - Input coordinates
   * @param {string} fromFormat - Source format (wgs84, web-mercator)
   * @param {string} toFormat - Target format (wgs84, web-mercator)
   * @returns {Array} Converted coordinates
   */
  static convertCoordinates(coordinates, fromFormat, toFormat) {
    // For now, assume all coordinates are in WGS84
    // In a real application, you would use ol.proj.transform()
    return coordinates;
  }

  /**
   * Calculate the area of a polygon in square meters
   * @param {Array} coordinates - Polygon coordinates
   * @returns {number} Area in square meters
   */
  static calculatePolygonArea(coordinates) {
    if (!coordinates || coordinates.length < 3) return 0;
    
    // Use the shoelace formula for polygon area calculation
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    
    area = Math.abs(area) / 2;
    
    // Convert from degrees to square meters (approximate)
    // This is a simplified calculation - in production, use proper geodesic calculations
    const metersPerDegree = 111320; // Approximate meters per degree at equator
    return area * Math.pow(metersPerDegree, 2);
  }

  /**
   * Calculate the perimeter of a polygon in meters
   * @param {Array} coordinates - Polygon coordinates
   * @returns {number} Perimeter in meters
   */
  static calculatePolygonPerimeter(coordinates) {
    if (!coordinates || coordinates.length < 2) return 0;
    
    let perimeter = 0;
    
    for (let i = 0; i < coordinates.length; i++) {
      const current = coordinates[i];
      const next = coordinates[(i + 1) % coordinates.length];
      
      // Calculate distance between points (simplified)
      const dx = (next[0] - current[0]) * 111320; // Convert longitude to meters
      const dy = (next[1] - current[1]) * 110540; // Convert latitude to meters
      
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    
    return perimeter;
  }

  /**
   * Check if a point is inside a polygon
   * @param {Array} point - [x, y] coordinates
   * @param {Array} polygon - Array of [x, y] coordinates
   * @returns {boolean} True if point is inside polygon
   */
  static pointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Get the bounding box of a set of coordinates
   * @param {Array} coordinates - Array of [x, y] coordinates
   * @returns {Array} Bounding box [minX, minY, maxX, maxY]
   */
  static getBoundingBox(coordinates) {
    if (!coordinates || coordinates.length === 0) return [0, 0, 0, 0];
    
    let minX = coordinates[0][0];
    let minY = coordinates[0][1];
    let maxX = coordinates[0][0];
    let maxY = coordinates[0][1];
    
    for (const [x, y] of coordinates) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    
    return [minX, minY, maxX, maxY];
  }

  /**
   * Load an image and return a promise
   * @param {string} src - Image source URL
   * @returns {Promise<HTMLImageElement>} Promise that resolves with loaded image
   */
  static loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      
      img.src = src;
    });
  }

  /**
   * Convert a File to a data URL
   * @param {File} file - File to convert
   * @returns {Promise<string>} Promise that resolves with data URL
   */
  static fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Download data as a file
   * @param {string} data - Data to download
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  static downloadFile(data, filename, mimeType = 'application/octet-stream') {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Get current timestamp in ISO format
   * @returns {string} ISO timestamp
   */
  static getCurrentTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Sanitize HTML string to prevent XSS
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Check if device is mobile
   * @returns {boolean} True if mobile device
   */
  static isMobile() {
    return window.innerWidth <= 767;
  }

  /**
   * Check if device is tablet
   * @returns {boolean} True if tablet device
   */
  static isTablet() {
    return window.innerWidth >= 768 && window.innerWidth <= 1199;
  }

  /**
   * Check if device is desktop
   * @returns {boolean} True if desktop device
   */
  static isDesktop() {
    return window.innerWidth >= 1200;
  }

  /**
   * Get device type
   * @returns {string} Device type (mobile, tablet, desktop)
   */
  static getDeviceType() {
    if (this.isMobile()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  }

  /**
   * Animate a numeric value
   * @param {number} from - Starting value
   * @param {number} to - Ending value
   * @param {number} duration - Animation duration in milliseconds
   * @param {Function} callback - Callback function called with current value
   * @returns {Function} Function to cancel animation
   */
  static animateValue(from, to, duration, callback) {
    const startTime = performance.now();
    const difference = to - from;
    let animationId;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = from + (difference * easeOut);
      
      callback(currentValue);
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    }
    
    animationId = requestAnimationFrame(animate);
    
    // Return cancel function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }

  /**
   * Create a loading indicator
   * @param {HTMLElement} container - Container element
   * @param {string} message - Loading message
   * @returns {HTMLElement} Loading element
   */
  static createLoadingIndicator(container, message = 'Loading...') {
    const loading = document.createElement('div');
    loading.className = 'loading-indicator';
    loading.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-message">${message}</div>
    `;
    
    container.appendChild(loading);
    return loading;
  }

  /**
   * Remove loading indicator
   * @param {HTMLElement} loading - Loading element to remove
   */
  static removeLoadingIndicator(loading) {
    if (loading && loading.parentNode) {
      loading.style.opacity = '0';
      setTimeout(() => {
        if (loading.parentNode) {
          loading.parentNode.removeChild(loading);
        }
      }, 300);
    }
  }

  /**
   * Handle errors gracefully
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @param {boolean} showNotification - Whether to show user notification
   */
  static handleError(error, context = 'Unknown', showNotification = true) {
    this.log('error', `Error in ${context}:`, error);
    
    if (showNotification) {
      const message = error.message || 'An unexpected error occurred';
      this.showNotification('error', 'Error', message);
    }
    
    // Report to analytics if enabled
    if (CONFIG.FEATURES.ENABLE_ANALYTICS) {
      // Analytics reporting would go here
    }
  }

  /**
   * Validate coordinates
   * @param {Array} coordinates - Coordinates to validate
   * @returns {boolean} True if coordinates are valid
   */
  static validateCoordinates(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
    
    const [lon, lat] = coordinates;
    
    return (
      typeof lon === 'number' && 
      typeof lat === 'number' &&
      lon >= -180 && lon <= 180 &&
      lat >= -90 && lat <= 90 &&
      !isNaN(lon) && !isNaN(lat)
    );
  }

  /**
   * Get user's current location
   * @returns {Promise<Array>} Promise that resolves with [longitude, latitude]
   */
  static getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Storage utilities for persisting application state
   */
  static storage = {
    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     */
    save(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        Utils.log('warn', 'Failed to save to localStorage:', error);
      }
    },

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Loaded data or default value
     */
    load(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        Utils.log('warn', 'Failed to load from localStorage:', error);
        return defaultValue;
      }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        Utils.log('warn', 'Failed to remove from localStorage:', error);
      }
    },

    /**
     * Clear all application data from localStorage
     */
    clear() {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('floorplan-mapper-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        Utils.log('warn', 'Failed to clear localStorage:', error);
      }
    }
  };
}

// Export Utils class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
} else if (typeof window !== 'undefined') {
  window.Utils = Utils;
}