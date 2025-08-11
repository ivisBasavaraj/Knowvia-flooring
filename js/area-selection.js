/**
 * Area Selection Manager - Handles interactive area selection on the map
 * Provides polygon, rectangle, and circle drawing tools with ExpoFP-style interactions
 */

class AreaSelectionManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.map = mapManager.getMap();
    this.currentTool = 'polygon';
    this.isDrawing = false;
    this.drawInteraction = null;
    this.modifyInteraction = null;
    this.selectInteraction = null;
    this.snapInteraction = null;
    this.selectedFeature = null;
    this.history = [];
    this.historyIndex = -1;
    
    // Bind methods
    this.handleDrawStart = this.handleDrawStart.bind(this);
    this.handleDrawEnd = this.handleDrawEnd.bind(this);
    this.handleModifyEnd = this.handleModifyEnd.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    
    this.initialize();
  }

  /**
   * Initialize area selection functionality
   */
  initialize() {
    try {
      this.setupInteractions();
      this.setupEventListeners();
      this.activateTool(this.currentTool);
      
      Utils.log('info', 'Area selection manager initialized');
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.initialize');
    }
  }

  /**
   * Setup OpenLayers interactions for drawing and selection
   */
  setupInteractions() {
    // Create select interaction
    this.selectInteraction = new ol.interaction.Select({
      layers: [this.mapManager.layers.get('areas')],
      style: this.mapManager.createAreaStyle(),
      hitTolerance: 5,
    });

    // Create modify interaction
    this.modifyInteraction = new ol.interaction.Modify({
      features: this.selectInteraction.getFeatures(),
      style: this.createModifyStyle(),
    });

    // Create snap interaction
    this.snapInteraction = new ol.interaction.Snap({
      source: this.mapManager.layers.get('areas').getSource(),
      pixelTolerance: CONFIG.SELECTION.SNAP_TOLERANCE,
    });

    // Add interactions to map
    this.map.addInteraction(this.selectInteraction);
    this.map.addInteraction(this.modifyInteraction);
    this.map.addInteraction(this.snapInteraction);

    // Setup interaction event listeners
    this.selectInteraction.on('select', (event) => {
      const selected = event.selected[0];
      this.selectedFeature = selected || null;
      
      if (selected) {
        this.updateSelectionInfo(selected);
        document.dispatchEvent(new CustomEvent('areaSelected', {
          detail: { feature: selected }
        }));
      }
    });

    this.modifyInteraction.on('modifyend', this.handleModifyEnd);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Tool button events
    document.querySelectorAll('[data-tool]').forEach(button => {
      button.addEventListener('click', (e) => {
        const tool = e.currentTarget.dataset.tool;
        this.activateTool(tool);
      });
    });

    // Clear selection button
    const clearBtn = document.getElementById('clear-selection');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearSelection());
    }

    // Save area button
    const saveBtn = document.getElementById('save-area');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSelectedArea());
    }

    // Undo/Redo buttons
    const undoBtn = document.getElementById('undo-action');
    const redoBtn = document.getElementById('redo-action');
    
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undo());
    }
    
    if (redoBtn) {
      redoBtn.addEventListener('click', () => this.redo());
    }
  }

  /**
   * Activate a drawing tool
   * @param {string} tool - Tool type (polygon, rectangle, circle, select)
   */
  activateTool(tool) {
    try {
      // Remove existing draw interaction
      if (this.drawInteraction) {
        this.map.removeInteraction(this.drawInteraction);
        this.drawInteraction = null;
      }

      this.currentTool = tool;
      this.isDrawing = false;

      // Update UI
      this.updateToolButtons();

      if (tool === 'select') {
        // Selection mode - no drawing interaction needed
        this.map.getTargetElement().style.cursor = '';
        return;
      }

      // Create appropriate draw interaction
      let geometryType;
      let geometryFunction;

      switch (tool) {
        case 'polygon':
          geometryType = 'Polygon';
          break;
        case 'rectangle':
          geometryType = 'Circle';
          geometryFunction = ol.interaction.Draw.createBox();
          break;
        case 'circle':
          geometryType = 'Circle';
          break;
        default:
          Utils.log('warn', `Unknown tool: ${tool}`);
          return;
      }

      // Create draw interaction
      this.drawInteraction = new ol.interaction.Draw({
        source: this.mapManager.layers.get('areas').getSource(),
        type: geometryType,
        geometryFunction: geometryFunction,
        style: this.createDrawStyle(),
        maxPoints: tool === 'polygon' ? CONFIG.SELECTION.MAX_POLYGON_POINTS : undefined,
      });

      // Add event listeners
      this.drawInteraction.on('drawstart', this.handleDrawStart);
      this.drawInteraction.on('drawend', this.handleDrawEnd);

      // Add to map
      this.map.addInteraction(this.drawInteraction);

      // Update cursor
      this.map.getTargetElement().style.cursor = 'crosshair';

      Utils.log('info', `Activated ${tool} drawing tool`);
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.activateTool');
    }
  }

  /**
   * Handle draw start event
   * @param {ol.interaction.Draw.Event} event - Draw start event
   */
  handleDrawStart(event) {
    this.isDrawing = true;
    
    // Clear previous selection
    this.selectInteraction.getFeatures().clear();
    
    Utils.log('debug', `Started drawing ${this.currentTool}`);
    
    // Show drawing instructions
    this.showDrawingInstructions();
  }

  /**
   * Handle draw end event
   * @param {ol.interaction.Draw.Event} event - Draw end event
   */
  handleDrawEnd(event) {
    this.isDrawing = false;
    const feature = event.feature;
    
    try {
      // Set feature properties
      feature.set('type', 'area');
      feature.set('id', Utils.generateId());
      feature.set('created', Utils.getCurrentTimestamp());
      feature.set('tool', this.currentTool);
      
      // Convert circle to polygon for consistent handling
      if (this.currentTool === 'circle') {
        const circle = feature.getGeometry();
        const polygon = ol.geom.Polygon.fromCircle(circle, 64);
        feature.setGeometry(polygon);
      }

      // Calculate measurements
      const area = this.mapManager.calculateFeatureArea(feature);
      const perimeter = this.mapManager.calculateFeaturePerimeter(feature);
      
      feature.set('area', area);
      feature.set('perimeter', perimeter);

      // Check minimum area requirement
      if (area.raw < CONFIG.SELECTION.MIN_AREA_SIZE) {
        this.mapManager.removeArea(feature);
        Utils.showNotification('warning', 'Area Too Small', CONFIG.ERRORS.AREA_TOO_SMALL);
        return;
      }

      // Add to history
      this.addToHistory('add', feature);

      // Select the new feature
      this.selectInteraction.getFeatures().push(feature);
      this.selectedFeature = feature;

      // Update UI
      this.updateSelectionInfo(feature);
      this.updateActionButtons();

      Utils.log('info', `Completed drawing ${this.currentTool}`, {
        area: area.metric,
        perimeter: perimeter.metric
      });

      Utils.showNotification('success', 'Area Selected', 
        `Selected area: ${area.metric} (${area.imperial})`);

      // Hide drawing instructions
      this.hideDrawingInstructions();
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.handleDrawEnd');
    }
  }

  /**
   * Handle modify end event
   * @param {ol.interaction.Modify.Event} event - Modify end event
   */
  handleModifyEnd(event) {
    const features = event.features.getArray();
    
    features.forEach(feature => {
      // Recalculate measurements
      const area = this.mapManager.calculateFeatureArea(feature);
      const perimeter = this.mapManager.calculateFeaturePerimeter(feature);
      
      feature.set('area', area);
      feature.set('perimeter', perimeter);
      feature.set('modified', Utils.getCurrentTimestamp());

      // Update UI
      this.updateSelectionInfo(feature);
    });

    // Add to history
    this.addToHistory('modify', features[0]);

    Utils.log('info', 'Modified area feature');
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    // Check if focus is on an input element
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrlKey = event.ctrlKey || event.metaKey;

    switch (true) {
      case key === 'escape':
        this.cancelDrawing();
        break;
      case key === 'delete' || key === 'backspace':
        this.deleteSelected();
        break;
      case ctrlKey && key === 'z':
        event.preventDefault();
        this.undo();
        break;
      case ctrlKey && (key === 'y' || (event.shiftKey && key === 'z')):
        event.preventDefault();
        this.redo();
        break;
      case key === 'p':
        this.activateTool('polygon');
        break;
      case key === 'r':
        this.activateTool('rectangle');
        break;
      case key === 'c':
        this.activateTool('circle');
        break;
      case key === 's':
        this.activateTool('select');
        break;
    }
  }

  /**
   * Create drawing style
   * @returns {ol.style.Style} OpenLayers style
   */
  createDrawStyle() {
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: CONFIG.SELECTION.STROKE_COLOR,
        width: CONFIG.SELECTION.STROKE_WIDTH,
        lineDash: [10, 5],
      }),
      fill: new ol.style.Fill({
        color: CONFIG.SELECTION.FILL_COLOR,
      }),
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({
          color: CONFIG.SELECTION.STROKE_COLOR,
        }),
        stroke: new ol.style.Stroke({
          color: '#ffffff',
          width: 2,
        }),
      }),
    });
  }

  /**
   * Create modify style
   * @returns {ol.style.Style} OpenLayers style
   */
  createModifyStyle() {
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({
          color: CONFIG.SELECTION.SELECTED_STROKE_COLOR,
        }),
        stroke: new ol.style.Stroke({
          color: '#ffffff',
          width: 2,
        }),
      }),
    });
  }

  /**
   * Update tool button states
   */
  updateToolButtons() {
    document.querySelectorAll('[data-tool]').forEach(button => {
      const tool = button.dataset.tool;
      button.classList.toggle('active', tool === this.currentTool);
    });
  }

  /**
   * Update selection information display
   * @param {ol.Feature} feature - Selected feature
   */
  updateSelectionInfo(feature) {
    const area = feature.get('area');
    const perimeter = feature.get('perimeter');
    
    const areaElement = document.getElementById('area-size');
    const perimeterElement = document.getElementById('area-perimeter');
    const measurementsContainer = document.getElementById('area-measurements');
    
    if (area && perimeter) {
      if (areaElement) areaElement.textContent = area.metric;
      if (perimeterElement) perimeterElement.textContent = perimeter.metric;
      if (measurementsContainer) measurementsContainer.style.display = 'block';
    }
  }

  /**
   * Update action button states
   */
  updateActionButtons() {
    const saveBtn = document.getElementById('save-area');
    const undoBtn = document.getElementById('undo-action');
    const redoBtn = document.getElementById('redo-action');
    
    if (saveBtn) {
      saveBtn.disabled = !this.selectedFeature;
    }
    
    if (undoBtn) {
      undoBtn.disabled = this.historyIndex < 0;
    }
    
    if (redoBtn) {
      redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
  }

  /**
   * Show drawing instructions
   */
  showDrawingInstructions() {
    const instructions = {
      polygon: 'Click to add points, double-click to finish',
      rectangle: 'Click and drag to create rectangle',
      circle: 'Click center point, then drag to set radius'
    };

    const message = instructions[this.currentTool] || 'Draw on the map';
    
    Utils.showNotification('info', 'Drawing Mode', message, 3000);
  }

  /**
   * Hide drawing instructions
   */
  hideDrawingInstructions() {
    // Instructions are automatically hidden by notification timeout
  }

  /**
   * Cancel current drawing operation
   */
  cancelDrawing() {
    if (this.drawInteraction && this.isDrawing) {
      this.drawInteraction.abortDrawing();
      this.isDrawing = false;
      
      Utils.showNotification('info', 'Drawing Cancelled', 'Drawing operation was cancelled');
      Utils.log('info', 'Drawing cancelled');
    }
  }

  /**
   * Clear all selected areas
   */
  clearSelection() {
    try {
      const features = this.mapManager.getAreaFeatures();
      
      if (features.length === 0) {
        Utils.showNotification('info', 'No Areas', 'No areas to clear');
        return;
      }

      // Add to history before clearing
      this.addToHistory('clear', features);

      // Clear features
      this.mapManager.clearAreas();
      this.selectInteraction.getFeatures().clear();
      this.selectedFeature = null;

      // Update UI
      this.updateSelectionInfo(null);
      this.updateActionButtons();
      
      // Hide measurements
      const measurementsContainer = document.getElementById('area-measurements');
      if (measurementsContainer) {
        measurementsContainer.style.display = 'none';
      }

      Utils.log('info', 'Cleared all area selections');
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.clearSelection');
    }
  }

  /**
   * Delete selected area
   */
  deleteSelected() {
    if (!this.selectedFeature) {
      Utils.showNotification('info', 'No Selection', 'No area selected to delete');
      return;
    }

    try {
      // Add to history
      this.addToHistory('delete', this.selectedFeature);

      // Remove feature
      this.mapManager.removeArea(this.selectedFeature);
      this.selectInteraction.getFeatures().clear();
      this.selectedFeature = null;

      // Update UI
      this.updateSelectionInfo(null);
      this.updateActionButtons();

      Utils.showNotification('success', 'Area Deleted', 'Selected area has been removed');
      Utils.log('info', 'Deleted selected area');
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.deleteSelected');
    }
  }

  /**
   * Save selected area
   */
  saveSelectedArea() {
    if (!this.selectedFeature) {
      Utils.showNotification('warning', 'No Selection', 'Please select an area to save');
      return;
    }

    try {
      const geometry = this.selectedFeature.getGeometry();
      const coordinates = geometry.getCoordinates();
      const area = this.selectedFeature.get('area');
      
      // Convert to GeoJSON
      const geoJson = {
        type: 'Feature',
        geometry: {
          type: geometry.getType(),
          coordinates: ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326')
        },
        properties: {
          id: this.selectedFeature.get('id'),
          name: `Area ${Date.now()}`,
          area: area.raw,
          created: this.selectedFeature.get('created'),
          tool: this.selectedFeature.get('tool')
        }
      };

      // Save to localStorage
      const savedAreas = Utils.storage.load('floorplan-mapper-areas', []);
      savedAreas.push(geoJson);
      Utils.storage.save('floorplan-mapper-areas', savedAreas);

      // Mark as saved
      this.selectedFeature.set('saved', true);
      this.selectedFeature.set('name', geoJson.properties.name);

      Utils.showNotification('success', 'Area Saved', 
        `Area saved successfully (${area.metric})`);
      Utils.log('info', 'Saved area to localStorage:', geoJson);

      // Emit custom event
      document.dispatchEvent(new CustomEvent('areaSaved', {
        detail: { feature: this.selectedFeature, geoJson }
      }));
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.saveSelectedArea');
    }
  }

  /**
   * Load saved areas from storage
   */
  loadSavedAreas() {
    try {
      const savedAreas = Utils.storage.load('floorplan-mapper-areas', []);
      
      savedAreas.forEach(geoJson => {
        const geometry = new ol.format.GeoJSON().readGeometry(geoJson.geometry, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        });

        const feature = new ol.Feature({
          geometry: geometry,
          type: 'area',
          ...geoJson.properties,
          saved: true
        });

        this.mapManager.layers.get('areas').getSource().addFeature(feature);
      });

      if (savedAreas.length > 0) {
        Utils.showNotification('info', 'Areas Loaded', 
          `Loaded ${savedAreas.length} saved area(s)`);
        Utils.log('info', `Loaded ${savedAreas.length} saved areas`);
      }
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.loadSavedAreas');
    }
  }

  /**
   * Add action to history for undo/redo functionality
   * @param {string} action - Action type (add, delete, modify, clear)
   * @param {ol.Feature|Array} target - Target feature(s)
   */
  addToHistory(action, target) {
    try {
      // Remove future history if we're not at the end
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }

      // Add new history entry
      const historyEntry = {
        action,
        timestamp: Utils.getCurrentTimestamp(),
        data: this.serializeFeatures(Array.isArray(target) ? target : [target])
      };

      this.history.push(historyEntry);
      this.historyIndex++;

      // Limit history size
      if (this.history.length > 50) {
        this.history.shift();
        this.historyIndex--;
      }

      this.updateActionButtons();
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.addToHistory');
    }
  }

  /**
   * Undo last action
   */
  undo() {
    if (this.historyIndex < 0) return;

    try {
      const historyEntry = this.history[this.historyIndex];
      this.historyIndex--;

      // Reverse the action
      switch (historyEntry.action) {
        case 'add':
          // Remove the added feature
          const addedFeatures = this.deserializeFeatures(historyEntry.data);
          addedFeatures.forEach(feature => {
            this.mapManager.removeArea(feature);
          });
          break;
        case 'delete':
          // Restore the deleted feature
          const deletedFeatures = this.deserializeFeatures(historyEntry.data);
          deletedFeatures.forEach(feature => {
            this.mapManager.layers.get('areas').getSource().addFeature(feature);
          });
          break;
        case 'clear':
          // Restore all cleared features
          const clearedFeatures = this.deserializeFeatures(historyEntry.data);
          clearedFeatures.forEach(feature => {
            this.mapManager.layers.get('areas').getSource().addFeature(feature);
          });
          break;
      }

      this.updateActionButtons();
      Utils.showNotification('info', 'Undo', 'Last action has been undone');
      Utils.log('info', `Undid action: ${historyEntry.action}`);
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.undo');
    }
  }

  /**
   * Redo last undone action
   */
  redo() {
    if (this.historyIndex >= this.history.length - 1) return;

    try {
      this.historyIndex++;
      const historyEntry = this.history[this.historyIndex];

      // Replay the action
      switch (historyEntry.action) {
        case 'add':
          // Re-add the feature
          const addedFeatures = this.deserializeFeatures(historyEntry.data);
          addedFeatures.forEach(feature => {
            this.mapManager.layers.get('areas').getSource().addFeature(feature);
          });
          break;
        case 'delete':
          // Re-delete the feature
          const deletedFeatures = this.deserializeFeatures(historyEntry.data);
          deletedFeatures.forEach(feature => {
            this.mapManager.removeArea(feature);
          });
          break;
        case 'clear':
          // Re-clear all features
          this.mapManager.clearAreas();
          break;
      }

      this.updateActionButtons();
      Utils.showNotification('info', 'Redo', 'Action has been redone');
      Utils.log('info', `Redid action: ${historyEntry.action}`);
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.redo');
    }
  }

  /**
   * Serialize features for history storage
   * @param {Array} features - Features to serialize
   * @returns {Array} Serialized feature data
   */
  serializeFeatures(features) {
    return features.map(feature => {
      const geometry = feature.getGeometry();
      const coordinates = geometry.getCoordinates();
      
      return {
        id: feature.get('id'),
        type: geometry.getType(),
        coordinates: coordinates,
        properties: feature.getProperties()
      };
    });
  }

  /**
   * Deserialize features from history storage
   * @param {Array} serializedData - Serialized feature data
   * @returns {Array} Deserialized features
   */
  deserializeFeatures(serializedData) {
    return serializedData.map(data => {
      let geometry;
      
      switch (data.type) {
        case 'Polygon':
          geometry = new ol.geom.Polygon(data.coordinates);
          break;
        case 'Circle':
          geometry = new ol.geom.Circle(data.coordinates[0], data.coordinates[1]);
          break;
        default:
          geometry = new ol.geom.Polygon(data.coordinates);
      }

      const feature = new ol.Feature({
        geometry: geometry,
        ...data.properties
      });

      return feature;
    });
  }

  /**
   * Get selected area as GeoJSON
   * @returns {object|null} GeoJSON representation of selected area
   */
  getSelectedAreaGeoJSON() {
    if (!this.selectedFeature) return null;

    try {
      const format = new ol.format.GeoJSON();
      return format.writeFeatureObject(this.selectedFeature, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.getSelectedAreaGeoJSON');
      return null;
    }
  }

  /**
   * Get all areas as GeoJSON
   * @returns {object} GeoJSON FeatureCollection
   */
  getAllAreasGeoJSON() {
    try {
      const features = this.mapManager.getAreaFeatures();
      const format = new ol.format.GeoJSON();
      
      return format.writeFeaturesObject(features, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.getAllAreasGeoJSON');
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Import areas from GeoJSON
   * @param {object} geoJson - GeoJSON data to import
   */
  importAreasFromGeoJSON(geoJson) {
    try {
      const format = new ol.format.GeoJSON();
      const features = format.readFeatures(geoJson, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });

      features.forEach(feature => {
        feature.set('type', 'area');
        feature.set('id', feature.get('id') || Utils.generateId());
        feature.set('imported', Utils.getCurrentTimestamp());
        
        // Calculate measurements
        const area = this.mapManager.calculateFeatureArea(feature);
        const perimeter = this.mapManager.calculateFeaturePerimeter(feature);
        
        feature.set('area', area);
        feature.set('perimeter', perimeter);
      });

      this.mapManager.layers.get('areas').getSource().addFeatures(features);
      
      Utils.showNotification('success', 'Areas Imported', 
        `Imported ${features.length} area(s) successfully`);
      Utils.log('info', `Imported ${features.length} areas from GeoJSON`);
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.importAreasFromGeoJSON');
    }
  }

  /**
   * Get current drawing tool
   * @returns {string} Current tool name
   */
  getCurrentTool() {
    return this.currentTool;
  }

  /**
   * Check if currently drawing
   * @returns {boolean} True if drawing is in progress
   */
  isCurrentlyDrawing() {
    return this.isDrawing;
  }

  /**
   * Get selected feature
   * @returns {ol.Feature|null} Selected feature
   */
  getSelectedFeature() {
    return this.selectedFeature;
  }

  /**
   * Select area by ID
   * @param {string} id - Area ID to select
   */
  selectAreaById(id) {
    const features = this.mapManager.getAreaFeatures();
    const feature = features.find(f => f.get('id') === id);
    
    if (feature) {
      this.selectInteraction.getFeatures().clear();
      this.selectInteraction.getFeatures().push(feature);
      this.selectedFeature = feature;
      this.updateSelectionInfo(feature);
      
      // Zoom to feature
      const extent = feature.getGeometry().getExtent();
      this.mapManager.getView().fit(extent, {
        duration: CONFIG.MAP.ANIMATION_DURATION,
        padding: [50, 50, 50, 50]
      });
    }
  }

  /**
   * Destroy area selection manager and clean up
   */
  destroy() {
    try {
      // Remove event listeners
      document.removeEventListener('keydown', this.handleKeyDown);
      
      // Remove interactions
      if (this.drawInteraction) {
        this.map.removeInteraction(this.drawInteraction);
      }
      if (this.modifyInteraction) {
        this.map.removeInteraction(this.modifyInteraction);
      }
      if (this.selectInteraction) {
        this.map.removeInteraction(this.selectInteraction);
      }
      if (this.snapInteraction) {
        this.map.removeInteraction(this.snapInteraction);
      }

      // Clear references
      this.drawInteraction = null;
      this.modifyInteraction = null;
      this.selectInteraction = null;
      this.snapInteraction = null;
      this.selectedFeature = null;
      this.history = [];
      this.historyIndex = -1;

      Utils.log('info', 'Area selection manager destroyed');
      
    } catch (error) {
      Utils.handleError(error, 'AreaSelectionManager.destroy');
    }
  }
}

// Export AreaSelectionManager class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AreaSelectionManager;
} else if (typeof window !== 'undefined') {
  window.AreaSelectionManager = AreaSelectionManager;
}