/**
 * UI Manager - Handles user interface interactions and state management
 * Provides ExpoFP-style interface controls and responsive behavior
 */

class UIManager {
  constructor(mapManager, areaSelectionManager, floorPlanManager) {
    this.mapManager = mapManager;
    this.areaSelectionManager = areaSelectionManager;
    this.floorPlanManager = floorPlanManager;
    
    this.currentTab = 'map-view';
    this.sidebarCollapsed = false;
    this.searchResults = [];
    this.searchTimeout = null;
    
    // Bind methods
    this.handleResize = Utils.debounce(this.handleResize.bind(this), 250);
    this.handleSearch = Utils.debounce(this.handleSearch.bind(this), 300);
    
    this.initialize();
  }

  /**
   * Initialize UI manager
   */
  initialize() {
    try {
      this.setupEventListeners();
      this.setupTabNavigation();
      this.setupModals();
      this.setupResponsiveHandlers();
      this.loadUserPreferences();
      
      Utils.log('info', 'UI manager initialized');
      
    } catch (error) {
      Utils.handleError(error, 'UIManager.initialize');
    }
  }

  /**
   * Setup main event listeners
   */
  setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // Search functionality
    const searchInput = document.getElementById('location-search');
    const searchClear = document.getElementById('search-clear');
    
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch);
      searchInput.addEventListener('focus', () => this.showSearchResults());
      searchInput.addEventListener('blur', () => {
        // Delay hiding to allow clicking on results
        setTimeout(() => this.hideSearchResults(), 200);
      });
    }
    
    if (searchClear) {
      searchClear.addEventListener('click', () => this.clearSearch());
    }

    // Quick location buttons
    document.querySelectorAll('.location-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const coords = JSON.parse(e.currentTarget.dataset.coords);
        const zoom = parseInt(e.currentTarget.dataset.zoom) || CONFIG.MAP.DEFAULT_ZOOM;
        this.mapManager.zoomToCoordinates(coords, zoom);
      });
    });

    // Base layer radio buttons
    document.querySelectorAll('input[name="base-layer"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.mapManager.switchBaseLayer(e.target.value);
        }
      });
    });

    // Layer toggles
    document.querySelectorAll('.layer-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const layerId = e.target.id.replace('-toggle', '').replace('-layer', '');
        this.toggleLayer(layerId, e.target.checked);
      });
    });

    // Map control buttons
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomFitBtn = document.getElementById('zoom-fit');
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.mapManager.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.mapManager.zoomOut());
    if (zoomFitBtn) zoomFitBtn.addEventListener('click', () => this.mapManager.fitToFeatures());

    // Drawing tool buttons
    document.querySelectorAll('.control-btn[data-tool]').forEach(button => {
      button.addEventListener('click', (e) => {
        const tool = e.currentTarget.dataset.tool;
        this.areaSelectionManager.activateTool(tool);
        this.updateDrawingToolButtons();
      });
    });

    // Action buttons
    const clearAllBtn = document.getElementById('clear-all');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.confirmClearAll());
    }

    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportMap());
    }

    // Settings and help buttons
    const settingsBtn = document.getElementById('settings-btn');
    const helpBtn = document.getElementById('help-btn');
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showModal('settings-modal'));
    }
    
    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.showModal('help-modal'));
    }

    // Window resize
    window.addEventListener('resize', this.handleResize);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleGlobalKeyboard(e));
  }

  /**
   * Setup tab navigation
   */
  setupTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = e.currentTarget.dataset.tab;
        this.switchTab(tabId);
      });
    });
  }

  /**
   * Setup modal functionality
   */
  setupModals() {
    // Modal close buttons
    document.querySelectorAll('.modal-close, [data-modal]').forEach(button => {
      button.addEventListener('click', (e) => {
        const modalId = e.currentTarget.dataset.modal || 
                       e.currentTarget.closest('.modal').id;
        this.hideModal(modalId);
      });
    });

    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Settings save button
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }
  }

  /**
   * Setup responsive behavior handlers
   */
  setupResponsiveHandlers() {
    // Initial responsive setup
    this.handleResize();
    
    // Mobile-specific interactions
    if (Utils.isMobile()) {
      this.setupMobileInteractions();
    }
  }

  /**
   * Setup mobile-specific interactions
   */
  setupMobileInteractions() {
    // Auto-collapse sidebar on mobile
    if (Utils.isMobile()) {
      this.sidebarCollapsed = true;
      this.updateSidebarState();
    }

    // Touch-friendly adjustments
    document.body.classList.add('mobile');
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const deviceType = Utils.getDeviceType();
    
    // Update body class for device type
    document.body.className = document.body.className.replace(/\b(mobile|tablet|desktop)\b/g, '');
    document.body.classList.add(deviceType);

    // Auto-collapse sidebar on mobile
    if (deviceType === 'mobile' && !this.sidebarCollapsed) {
      this.toggleSidebar();
    }

    // Trigger map resize
    if (this.mapManager.isMapInitialized()) {
      setTimeout(() => {
        this.mapManager.getMap().updateSize();
      }, 100);
    }

    Utils.log('debug', `Window resized - Device type: ${deviceType}`);
  }

  /**
   * Switch between tabs
   * @param {string} tabId - Tab ID to switch to
   */
  switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabId}-tab`);
    });

    this.currentTab = tabId;
    
    // Save preference
    Utils.storage.save('floorplan-mapper-active-tab', tabId);
    
    Utils.log('debug', `Switched to tab: ${tabId}`);
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.updateSidebarState();
    
    // Update map size after animation
    setTimeout(() => {
      if (this.mapManager.isMapInitialized()) {
        this.mapManager.getMap().updateSize();
      }
    }, 300);
    
    // Save preference
    Utils.storage.save('floorplan-mapper-sidebar-collapsed', this.sidebarCollapsed);
  }

  /**
   * Update sidebar state
   */
  updateSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.querySelector('#sidebar-toggle i');
    
    if (sidebar) {
      sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
    }
    
    if (toggleIcon) {
      toggleIcon.className = this.sidebarCollapsed ? 
        'fas fa-chevron-right' : 'fas fa-chevron-left';
    }
  }

  /**
   * Handle search input
   * @param {Event} event - Input event
   */
  async handleSearch(event) {
    const query = event.target.value.trim();
    const searchClear = document.getElementById('search-clear');
    
    // Show/hide clear button
    if (searchClear) {
      searchClear.style.display = query ? 'block' : 'none';
    }

    if (query.length < 3) {
      this.hideSearchResults();
      return;
    }

    try {
      // Show loading state
      this.showSearchLoading();
      
      // Perform geocoding search
      const results = await this.mapManager.geocodeSearch(query);
      this.searchResults = results;
      
      // Display results
      this.displaySearchResults(results);
      
    } catch (error) {
      Utils.handleError(error, 'UIManager.handleSearch');
      this.hideSearchResults();
    }
  }

  /**
   * Display search results
   * @param {Array} results - Search results
   */
  displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-result-item">
          <div class="result-title">No results found</div>
          <div class="result-description">Try a different search term</div>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = results.map(result => `
        <div class="search-result-item" data-coords="${result.coordinates[0]},${result.coordinates[1]}">
          <div class="result-title">${Utils.sanitizeHtml(result.name)}</div>
          <div class="result-description">${result.type}</div>
        </div>
      `).join('');

      // Add click handlers
      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const coords = e.currentTarget.dataset.coords.split(',').map(Number);
          this.mapManager.zoomToCoordinates(coords, 16);
          this.hideSearchResults();
          
          // Clear search input
          document.getElementById('location-search').value = '';
          document.getElementById('search-clear').style.display = 'none';
        });
      });
    }

    this.showSearchResults();
  }

  /**
   * Show search loading state
   */
  showSearchLoading() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="search-result-item">
          <div class="result-title">Searching...</div>
          <div class="result-description">Please wait</div>
        </div>
      `;
      this.showSearchResults();
    }
  }

  /**
   * Show search results dropdown
   */
  showSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
      resultsContainer.style.display = 'block';
    }
  }

  /**
   * Hide search results dropdown
   */
  hideSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
    }
  }

  /**
   * Clear search input and results
   */
  clearSearch() {
    const searchInput = document.getElementById('location-search');
    const searchClear = document.getElementById('search-clear');
    
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    
    if (searchClear) {
      searchClear.style.display = 'none';
    }
    
    this.hideSearchResults();
    this.searchResults = [];
  }

  /**
   * Update drawing tool button states
   */
  updateDrawingToolButtons() {
    const currentTool = this.areaSelectionManager.getCurrentTool();
    
    document.querySelectorAll('.control-btn[data-tool]').forEach(button => {
      const tool = button.dataset.tool;
      button.classList.toggle('active', tool === currentTool);
    });
  }

  /**
   * Toggle layer visibility
   * @param {string} layerId - Layer ID
   * @param {boolean} visible - Visibility state
   */
  toggleLayer(layerId, visible) {
    switch (layerId) {
      case 'base':
        // Base layer is always visible, but we can switch types
        break;
      case 'areas':
        this.mapManager.toggleLayer('areas');
        break;
      case 'floorplans':
        this.mapManager.toggleLayer('floorplans');
        break;
      default:
        Utils.log('warn', `Unknown layer ID: ${layerId}`);
    }
  }

  /**
   * Show modal
   * @param {string} modalId - Modal ID to show
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      
      // Focus first input if available
      const firstInput = modal.querySelector('input, textarea, button');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
      
      Utils.log('debug', `Showed modal: ${modalId}`);
    }
  }

  /**
   * Hide modal
   * @param {string} modalId - Modal ID to hide
   */
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      Utils.log('debug', `Hid modal: ${modalId}`);
    }
  }

  /**
   * Confirm clear all action
   */
  confirmClearAll() {
    const hasAreas = this.mapManager.getAreaFeatures().length > 0;
    const hasFloorPlans = this.floorPlanManager.getFloorPlans().size > 0;
    
    if (!hasAreas && !hasFloorPlans) {
      Utils.showNotification('info', 'Nothing to Clear', 'No areas or floor plans to remove');
      return;
    }

    // Create confirmation dialog
    const confirmed = confirm('Are you sure you want to clear all areas and floor plans? This action cannot be undone.');
    
    if (confirmed) {
      this.areaSelectionManager.clearSelection();
      this.floorPlanManager.clearAllFloorPlans();
      
      Utils.showNotification('success', 'Cleared All', 'All areas and floor plans have been removed');
    }
  }

  /**
   * Export map and data
   */
  async exportMap() {
    try {
      // Show loading notification
      Utils.showNotification('info', 'Exporting...', 'Preparing map export');

      // Get current map state
      const mapState = this.mapManager.getMapState();
      
      // Get areas as GeoJSON
      const areasGeoJSON = this.areaSelectionManager.getAllAreasGeoJSON();
      
      // Get floor plan data
      const floorPlanData = this.floorPlanManager.exportFloorPlans();

      // Create export package
      const exportData = {
        version: CONFIG.APP.VERSION,
        exported: Utils.getCurrentTimestamp(),
        mapState: mapState,
        areas: areasGeoJSON,
        floorPlans: floorPlanData,
        settings: this.getUserPreferences()
      };

      // Export as JSON file
      const filename = `floorplan-mapper-export-${new Date().toISOString().split('T')[0]}.json`;
      Utils.downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');

      // Also export map as image
      const mapImage = await this.mapManager.exportMap('png', 0.9);
      const imageFilename = `floorplan-mapper-${new Date().toISOString().split('T')[0]}.png`;
      
      // Convert data URL to blob and download
      const link = document.createElement('a');
      link.href = mapImage;
      link.download = imageFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Utils.showNotification('success', 'Export Complete', 'Map and data exported successfully');
      
    } catch (error) {
      Utils.handleError(error, 'UIManager.exportMap');
    }
  }

  /**
   * Handle global keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleGlobalKeyboard(event) {
    // Skip if focus is on input elements
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrlKey = event.ctrlKey || event.metaKey;

    switch (true) {
      case ctrlKey && key === 's':
        event.preventDefault();
        this.saveCurrentState();
        break;
      case ctrlKey && key === 'e':
        event.preventDefault();
        this.exportMap();
        break;
      case ctrlKey && key === 'b':
        event.preventDefault();
        this.toggleSidebar();
        break;
      case key === 'f1' || key === '?':
        event.preventDefault();
        this.showModal('help-modal');
        break;
      case key === 'escape':
        this.closeAllModals();
        break;
      case key === '+' || key === '=':
        event.preventDefault();
        this.mapManager.zoomIn();
        break;
      case key === '-' || key === '_':
        event.preventDefault();
        this.mapManager.zoomOut();
        break;
      case ctrlKey && key === '0':
        event.preventDefault();
        this.mapManager.fitToFeatures();
        break;
    }
  }

  /**
   * Close all open modals
   */
  closeAllModals() {
    document.querySelectorAll('.modal.show').forEach(modal => {
      modal.classList.remove('show');
    });
  }

  /**
   * Save current application state
   */
  saveCurrentState() {
    try {
      const state = {
        map: this.mapManager.getMapState(),
        ui: {
          currentTab: this.currentTab,
          sidebarCollapsed: this.sidebarCollapsed
        },
        timestamp: Utils.getCurrentTimestamp()
      };

      Utils.storage.save('floorplan-mapper-state', state);
      Utils.showNotification('success', 'State Saved', 'Current application state has been saved');
      
    } catch (error) {
      Utils.handleError(error, 'UIManager.saveCurrentState');
    }
  }

  /**
   * Load saved application state
   */
  loadSavedState() {
    try {
      const state = Utils.storage.load('floorplan-mapper-state');
      if (!state) return;

      // Restore UI state
      if (state.ui) {
        if (state.ui.currentTab) {
          this.switchTab(state.ui.currentTab);
        }
        
        if (state.ui.sidebarCollapsed !== undefined) {
          this.sidebarCollapsed = state.ui.sidebarCollapsed;
          this.updateSidebarState();
        }
      }

      // Restore map state
      if (state.map) {
        this.mapManager.restoreMapState(state.map);
      }

      Utils.log('info', 'Loaded saved application state');
      
    } catch (error) {
      Utils.handleError(error, 'UIManager.loadSavedState');
    }
  }

  /**
   * Save user settings
   */
  saveSettings() {
    try {
      const settings = {
        showCoordinates: document.getElementById('show-coordinates')?.checked ?? true,
        smoothZoom: document.getElementById('smooth-zoom')?.checked ?? true,
        autoFit: document.getElementById('auto-fit')?.checked ?? true,
        showBounds: document.getElementById('show-bounds')?.checked ?? true,
      };

      Utils.storage.save('floorplan-mapper-settings', settings);
      this.applySettings(settings);
      this.hideModal('settings-modal');
      
      Utils.showNotification('success', 'Settings Saved', 'Your preferences have been saved');
      
    } catch (error) {
      Utils.handleError(error, 'UIManager.saveSettings');
    }
  }

  /**
   * Load user preferences
   */
  loadUserPreferences() {
    try {
      // Load saved tab
      const savedTab = Utils.storage.load('floorplan-mapper-active-tab', 'map-view');
      this.switchTab(savedTab);

      // Load sidebar state
      const sidebarCollapsed = Utils.storage.load('floorplan-mapper-sidebar-collapsed', false);
      if (sidebarCollapsed !== this.sidebarCollapsed) {
        this.sidebarCollapsed = sidebarCollapsed;
        this.updateSidebarState();
      }

      // Load settings
      const settings = Utils.storage.load('floorplan-mapper-settings', {
        showCoordinates: true,
        smoothZoom: true,
        autoFit: true,
        showBounds: true,
      });
      
      this.applySettings(settings);
      
    } catch (error) {
      Utils.handleError(error, 'UIManager.loadUserPreferences');
    }
  }

  /**
   * Apply user settings
   * @param {object} settings - Settings object
   */
  applySettings(settings) {
    // Update checkbox states
    const checkboxes = {
      'show-coordinates': settings.showCoordinates,
      'smooth-zoom': settings.smoothZoom,
      'auto-fit': settings.autoFit,
      'show-bounds': settings.showBounds,
    };

    Object.entries(checkboxes).forEach(([id, checked]) => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = checked;
      }
    });

    // Apply settings to map
    const mapInfo = document.getElementById('map-info');
    if (mapInfo) {
      mapInfo.style.display = settings.showCoordinates ? 'block' : 'none';
    }

    // Store settings for other modules to access
    this.settings = settings;
  }

  /**
   * Get user preferences
   * @returns {object} User preferences
   */
  getUserPreferences() {
    return {
      currentTab: this.currentTab,
      sidebarCollapsed: this.sidebarCollapsed,
      settings: this.settings || {}
    };
  }

  /**
   * Show loading screen
   * @param {string} message - Loading message
   */
  showLoadingScreen(message = 'Loading...') {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingText = loadingScreen.querySelector('p');
    
    if (loadingText) {
      loadingText.textContent = message;
    }
    
    loadingScreen.classList.remove('hidden');
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('hidden');
    
    // Show main app
    const app = document.getElementById('app');
    app.style.display = 'flex';
  }

  /**
   * Update loading progress
   * @param {number} percent - Progress percentage (0-100)
   * @param {string} message - Progress message
   */
  updateLoadingProgress(percent, message) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${Math.round(percent)}%`;
    }
    
    if (message) {
      const loadingText = document.querySelector('#loading-screen p');
      if (loadingText) {
        loadingText.textContent = message;
      }
    }
  }

  /**
   * Initialize application with loading sequence
   */
  async initializeApp() {
    try {
      const steps = [
        { percent: 10, message: 'Checking browser compatibility...' },
        { percent: 25, message: 'Loading map tiles...' },
        { percent: 50, message: 'Initializing drawing tools...' },
        { percent: 75, message: 'Loading saved data...' },
        { percent: 90, message: 'Setting up user interface...' },
        { percent: 100, message: 'Ready!' }
      ];

      for (const step of steps) {
        this.updateLoadingProgress(step.percent, step.message);
        await Utils.delay(200);
      }

      // Ensure minimum loading time for smooth UX
      await Utils.delay(CONFIG.UI.MIN_LOADING_TIME);
      
      this.hideLoadingScreen();
      
    } catch (error) {
      Utils.handleError(error, 'UIManager.initializeApp');
    }
  }

  /**
   * Handle responsive breakpoint changes
   * @param {string} breakpoint - Current breakpoint (mobile, tablet, desktop)
   */
  handleBreakpointChange(breakpoint) {
    Utils.log('debug', `Breakpoint changed to: ${breakpoint}`);
    
    // Adjust UI based on breakpoint
    switch (breakpoint) {
      case 'mobile':
        if (!this.sidebarCollapsed) {
          this.toggleSidebar();
        }
        break;
      case 'tablet':
        // Tablet-specific adjustments
        break;
      case 'desktop':
        // Desktop-specific adjustments
        break;
    }
  }

  /**
   * Create and show a custom confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {Function} onConfirm - Callback for confirm action
   * @param {Function} onCancel - Callback for cancel action
   */
  showConfirmDialog(title, message, onConfirm, onCancel) {
    // Create modal HTML
    const modalHtml = `
      <div id="confirm-dialog" class="modal show">
        <div class="modal-content">
          <div class="modal-header">
            <h3>${title}</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn secondary" id="confirm-cancel">Cancel</button>
            <button class="btn primary" id="confirm-ok">Confirm</button>
          </div>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('confirm-dialog');
    const cancelBtn = document.getElementById('confirm-cancel');
    const confirmBtn = document.getElementById('confirm-ok');

    // Handle actions
    const cleanup = () => {
      modal.remove();
    };

    cancelBtn.addEventListener('click', () => {
      cleanup();
      if (onCancel) onCancel();
    });

    confirmBtn.addEventListener('click', () => {
      cleanup();
      if (onConfirm) onConfirm();
    });

    // Close on escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        if (onCancel) onCancel();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Update UI based on current application state
   */
  updateUI() {
    // Update drawing tool buttons
    this.updateDrawingToolButtons();
    
    // Update floor plan list
    this.floorPlanManager.updateFloorPlanList();
    
    // Update action button states
    const hasSelection = this.areaSelectionManager.getSelectedFeature() !== null;
    const saveAreaBtn = document.getElementById('save-area');
    
    if (saveAreaBtn) {
      saveAreaBtn.disabled = !hasSelection;
    }
  }

  /**
   * Get current UI state
   * @returns {object} Current UI state
   */
  getUIState() {
    return {
      currentTab: this.currentTab,
      sidebarCollapsed: this.sidebarCollapsed,
      searchResults: this.searchResults,
      settings: this.settings
    };
  }

  /**
   * Destroy UI manager and clean up
   */
  destroy() {
    try {
      // Remove event listeners
      window.removeEventListener('resize', this.handleResize);
      
      // Clear search timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      // Clear references
      this.mapManager = null;
      this.areaSelectionManager = null;
      this.floorPlanManager = null;
      this.searchResults = [];

      Utils.log('info', 'UI manager destroyed');
      
    } catch (error) {
      Utils.handleError(error, 'UIManager.destroy');
    }
  }
}

// Export UIManager class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
} else if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}