/**
 * Main Application Entry Point
 * Initializes and coordinates all application modules
 */

class FloorPlanMapperApp {
  constructor() {
    this.mapManager = null;
    this.areaSelectionManager = null;
    this.floorPlanManager = null;
    this.uiManager = null;
    this.isInitialized = false;
    
    // Bind methods
    this.handleError = this.handleError.bind(this);
    this.handleUnload = this.handleUnload.bind(this);
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      Utils.log('info', 'Starting FloorPlan Mapper application...');
      
      // Check browser compatibility
      await this.checkBrowserCompatibility();
      
      // Initialize UI manager first for loading screen
      this.uiManager = new UIManager(null, null, null);
      
      // Show loading screen
      this.uiManager.showLoadingScreen('Initializing application...');
      
      // Initialize core modules with progress updates
      await this.initializeModules();
      
      // Setup global error handling
      this.setupErrorHandling();
      
      // Setup cleanup on page unload
      window.addEventListener('beforeunload', this.handleUnload);
      
      // Mark as initialized
      this.isInitialized = true;
      
      // Complete initialization
      await this.uiManager.initializeApp();
      
      Utils.log('info', 'FloorPlan Mapper application initialized successfully');
      Utils.showNotification('success', 'Application Ready', 'FloorPlan Mapper is ready to use');
      
    } catch (error) {
      this.handleError(error, 'Application initialization failed');
    }
  }

  /**
   * Check browser compatibility
   */
  async checkBrowserCompatibility() {
    const support = Utils.checkBrowserSupport();
    
    if (!support.all) {
      const missingFeatures = Object.entries(support)
        .filter(([key, value]) => key !== 'all' && !value)
        .map(([key]) => key);
      
      const message = `Your browser is missing support for: ${missingFeatures.join(', ')}. Some features may not work correctly.`;
      
      Utils.showNotification('warning', 'Browser Compatibility', message, 10000);
      Utils.log('warn', 'Browser compatibility issues:', missingFeatures);
    }
    
    // Simulate compatibility check delay
    await Utils.delay(200);
  }

  /**
   * Initialize core application modules
   */
  async initializeModules() {
    try {
      // Step 1: Initialize Map Manager (25% - 50%)
      this.uiManager.updateLoadingProgress(25, 'Initializing map...');
      this.mapManager = new MapManager();
      await this.mapManager.initialize('map');
      
      // Step 2: Initialize Area Selection Manager (50% - 65%)
      this.uiManager.updateLoadingProgress(50, 'Setting up area selection...');
      this.areaSelectionManager = new AreaSelectionManager(this.mapManager);
      await Utils.delay(300);
      
      // Step 3: Initialize Floor Plan Manager (65% - 80%)
      this.uiManager.updateLoadingProgress(65, 'Loading floor plan system...');
      this.floorPlanManager = new FloorPlanManager(this.mapManager, this.areaSelectionManager);
      await Utils.delay(300);
      
      // Step 4: Update UI Manager with module references (80% - 90%)
      this.uiManager.updateLoadingProgress(80, 'Finalizing user interface...');
      this.uiManager.mapManager = this.mapManager;
      this.uiManager.areaSelectionManager = this.areaSelectionManager;
      this.uiManager.floorPlanManager = this.floorPlanManager;
      
      // Step 5: Load saved data (90% - 95%)
      this.uiManager.updateLoadingProgress(90, 'Loading saved data...');
      this.areaSelectionManager.loadSavedAreas();
      this.uiManager.loadSavedState();
      
      // Step 6: Final setup (95% - 100%)
      this.uiManager.updateLoadingProgress(95, 'Completing setup...');
      this.setupGlobalEventListeners();
      await Utils.delay(200);
      
    } catch (error) {
      throw new Error(`Module initialization failed: ${error.message}`);
    }
  }

  /**
   * Setup global event listeners
   */
  setupGlobalEventListeners() {
    // Custom events from modules
    document.addEventListener('mapClick', (event) => {
      Utils.log('debug', 'Map clicked:', event.detail);
    });

    document.addEventListener('areaSelected', (event) => {
      Utils.log('debug', 'Area selected:', event.detail);
      this.uiManager.updateUI();
    });

    document.addEventListener('areaSaved', (event) => {
      Utils.log('debug', 'Area saved:', event.detail);
    });

    document.addEventListener('floorPlanActivated', (event) => {
      Utils.log('debug', 'Floor plan activated:', event.detail);
    });

    // Performance monitoring
    if (CONFIG.DEV.ENABLE_PERFORMANCE_MONITORING) {
      this.setupPerformanceMonitoring();
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        };
        
        Utils.log('debug', 'Memory usage:', memoryUsage);
        
        // Warn if memory usage is high
        if (memoryUsage.used > memoryUsage.limit * 0.8) {
          Utils.log('warn', 'High memory usage detected');
        }
      }, 30000); // Check every 30 seconds
    }

    // Monitor map rendering performance
    if (this.mapManager && this.mapManager.getMap()) {
      this.mapManager.getMap().on('rendercomplete', () => {
        const renderTime = performance.now();
        Utils.log('debug', 'Map render completed at:', renderTime);
      });
    }
  }

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'Global error');
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Unhandled promise rejection');
      event.preventDefault();
    });
  }

  /**
   * Handle application errors
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  handleError(error, context = 'Unknown') {
    Utils.handleError(error, context, true);
    
    // Additional error handling for critical errors
    if (context.includes('initialization') || context.includes('Global')) {
      // Show error modal for critical errors
      const errorModal = this.createErrorModal(error, context);
      document.body.appendChild(errorModal);
    }
  }

  /**
   * Create error modal for critical errors
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @returns {HTMLElement} Error modal element
   */
  createErrorModal(error, context) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Application Error</h3>
        </div>
        <div class="modal-body">
          <div class="error-details">
            <p><strong>Context:</strong> ${context}</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <details>
              <summary>Technical Details</summary>
              <pre>${error.stack || 'No stack trace available'}</pre>
            </details>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" onclick="location.reload()">Reload Application</button>
          <button class="btn primary" onclick="this.closest('.modal').remove()">Continue</button>
        </div>
      </div>
    `;
    
    return modal;
  }

  /**
   * Handle page unload
   * @param {BeforeUnloadEvent} event - Unload event
   */
  handleUnload(event) {
    try {
      // Save current state
      if (this.uiManager) {
        this.uiManager.saveCurrentState();
      }
      
      // Clean up resources
      this.destroy();
      
    } catch (error) {
      Utils.log('error', 'Error during application cleanup:', error);
    }
  }

  /**
   * Get application status
   * @returns {object} Application status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      modules: {
        mapManager: !!this.mapManager,
        areaSelectionManager: !!this.areaSelectionManager,
        floorPlanManager: !!this.floorPlanManager,
        uiManager: !!this.uiManager
      },
      mapReady: this.mapManager?.isMapInitialized() || false,
      version: CONFIG.APP.VERSION,
      timestamp: Utils.getCurrentTimestamp()
    };
  }

  /**
   * Restart the application
   */
  async restart() {
    try {
      Utils.log('info', 'Restarting application...');
      
      // Destroy current instance
      this.destroy();
      
      // Clear storage if requested
      const clearStorage = confirm('Clear all saved data? This will remove all saved areas and floor plans.');
      if (clearStorage) {
        Utils.storage.clear();
      }
      
      // Reinitialize
      await this.initialize();
      
    } catch (error) {
      this.handleError(error, 'Application restart');
    }
  }

  /**
   * Destroy application and clean up resources
   */
  destroy() {
    try {
      Utils.log('info', 'Destroying application...');
      
      // Destroy modules in reverse order
      if (this.uiManager) {
        this.uiManager.destroy();
        this.uiManager = null;
      }
      
      if (this.floorPlanManager) {
        this.floorPlanManager.destroy();
        this.floorPlanManager = null;
      }
      
      if (this.areaSelectionManager) {
        this.areaSelectionManager.destroy();
        this.areaSelectionManager = null;
      }
      
      if (this.mapManager) {
        this.mapManager.destroy();
        this.mapManager = null;
      }

      // Remove global event listeners
      window.removeEventListener('beforeunload', this.handleUnload);
      
      this.isInitialized = false;
      
      Utils.log('info', 'Application destroyed successfully');
      
    } catch (error) {
      Utils.log('error', 'Error during application destruction:', error);
    }
  }
}

// Global application instance
let app = null;

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    Utils.log('info', 'DOM loaded, initializing application...');
    
    // Create and initialize application
    app = new FloorPlanMapperApp();
    await app.initialize();
    
    // Make app globally accessible for debugging
    if (CONFIG.APP.DEBUG) {
      window.app = app;
      window.mapManager = app.mapManager;
      window.areaSelectionManager = app.areaSelectionManager;
      window.floorPlanManager = app.floorPlanManager;
      window.uiManager = app.uiManager;
    }
    
  } catch (error) {
    Utils.log('error', 'Failed to initialize application:', error);
    
    // Show error message to user
    const errorMessage = document.createElement('div');
    errorMessage.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        text-align: center;
        z-index: 10000;
      ">
        <h2 style="color: #dc3545; margin-bottom: 1rem;">
          <i class="fas fa-exclamation-triangle"></i>
          Application Error
        </h2>
        <p style="margin-bottom: 1rem;">
          Failed to initialize the application. Please check your internet connection and try again.
        </p>
        <button onclick="location.reload()" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        ">
          Reload Application
        </button>
      </div>
    `;
    
    document.body.appendChild(errorMessage);
  }
});

/**
 * Handle application visibility changes
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden - pause non-essential operations
    Utils.log('debug', 'Application hidden - pausing operations');
  } else {
    // Page is visible - resume operations
    Utils.log('debug', 'Application visible - resuming operations');
    
    // Update map size in case window was resized while hidden
    if (app && app.mapManager && app.mapManager.isMapInitialized()) {
      setTimeout(() => {
        app.mapManager.getMap().updateSize();
      }, 100);
    }
  }
});

/**
 * Handle online/offline status
 */
window.addEventListener('online', () => {
  Utils.showNotification('success', 'Connection Restored', 'Internet connection is back online');
  Utils.log('info', 'Application back online');
});

window.addEventListener('offline', () => {
  Utils.showNotification('warning', 'Connection Lost', 'Internet connection lost. Some features may not work.');
  Utils.log('warn', 'Application went offline');
});

/**
 * Expose global functions for HTML onclick handlers
 */
window.showModal = (modalId) => {
  if (app && app.uiManager) {
    app.uiManager.showModal(modalId);
  }
};

window.hideModal = (modalId) => {
  if (app && app.uiManager) {
    app.uiManager.hideModal(modalId);
  }
};

/**
 * Development and debugging utilities
 */
if (CONFIG.APP.DEBUG) {
  // Global debug functions
  window.debugApp = () => {
    console.log('=== FloorPlan Mapper Debug Info ===');
    console.log('App Status:', app?.getStatus());
    console.log('Map State:', app?.mapManager?.getMapState());
    console.log('UI State:', app?.uiManager?.getUIState());
    console.log('Floor Plans:', app?.floorPlanManager?.getFloorPlans());
    console.log('Selected Area:', app?.areaSelectionManager?.getSelectedFeature());
    console.log('Browser Support:', Utils.checkBrowserSupport());
    console.log('Device Type:', Utils.getDeviceType());
  };

  window.clearAppData = () => {
    if (confirm('Clear all application data? This will remove all saved areas, floor plans, and settings.')) {
      Utils.storage.clear();
      location.reload();
    }
  };

  window.exportDebugData = () => {
    const debugData = {
      status: app?.getStatus(),
      mapState: app?.mapManager?.getMapState(),
      uiState: app?.uiManager?.getUIState(),
      browserSupport: Utils.checkBrowserSupport(),
      config: CONFIG,
      timestamp: Utils.getCurrentTimestamp()
    };
    
    Utils.downloadFile(
      JSON.stringify(debugData, null, 2),
      `floorplan-mapper-debug-${Date.now()}.json`,
      'application/json'
    );
  };

  // Log application start
  console.log(`
    ╔══════════════════════════════════════╗
    ║        FloorPlan Mapper v${CONFIG.APP.VERSION}        ║
    ║     Interactive Mapping Solution     ║
    ╠══════════════════════════════════════╣
    ║ Debug Mode: Enabled                  ║
    ║ Available Commands:                  ║
    ║ • debugApp() - Show debug info       ║
    ║ • clearAppData() - Clear all data    ║
    ║ • exportDebugData() - Export debug   ║
    ╚══════════════════════════════════════╝
  `);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FloorPlanMapperApp;
}