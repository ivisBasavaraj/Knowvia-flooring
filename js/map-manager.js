/**
 * Map Manager - Handles OpenLayers map initialization and management
 * Provides core mapping functionality with ExpoFP-style interactions
 */

class MapManager {
  constructor() {
    this.map = null;
    this.view = null;
    this.layers = new Map();
    this.overlays = new Map();
    this.currentBaseLayer = 'satellite';
    this.isInitialized = false;
    
    // Bind methods to preserve context
    this.handleMapClick = this.handleMapClick.bind(this);
    this.handleMapMove = this.handleMapMove.bind(this);
    this.updateCoordinateDisplay = Utils.throttle(this.updateCoordinateDisplay.bind(this), 100);
  }

  /**
   * Initialize the OpenLayers map
   * @param {string} containerId - ID of the map container element
   * @returns {Promise<void>}
   */
  async initialize(containerId) {
    try {
      Utils.log('info', 'Initializing OpenLayers map...');
      
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Map container '${containerId}' not found`);
      }

      // Create map view
      this.view = new ol.View({
        center: ol.proj.fromLonLat(CONFIG.MAP.DEFAULT_CENTER),
        zoom: CONFIG.MAP.DEFAULT_ZOOM,
        minZoom: CONFIG.MAP.MIN_ZOOM,
        maxZoom: CONFIG.MAP.MAX_ZOOM,
        extent: ol.proj.transformExtent(CONFIG.MAP.MAX_EXTENT, 'EPSG:4326', 'EPSG:3857'),
        smoothExtentConstraint: true,
        enableRotation: false, // Disable rotation for better UX
      });

      // Create base layers
      this.createBaseLayers();

      // Create vector layers for overlays
      this.createVectorLayers();

      // Initialize the map
      this.map = new ol.Map({
        target: container,
        layers: [this.layers.get(this.currentBaseLayer)],
        view: this.view,
        controls: ol.control.defaults({
          zoom: false, // We'll use custom zoom controls
          attribution: true,
          rotate: false,
        }),
        interactions: ol.interaction.defaults({
          doubleClickZoom: CONFIG.MAP.DOUBLE_CLICK_ZOOM,
          keyboard: CONFIG.MAP.KEYBOARD_PAN,
          mouseWheelZoom: CONFIG.MAP.MOUSE_WHEEL_ZOOM,
        }),
        pixelRatio: CONFIG.PERFORMANCE.PIXEL_RATIO,
      });

      // Add event listeners
      this.setupEventListeners();

      // Add vector layers to map
      this.map.addLayer(this.layers.get('areas'));
      this.map.addLayer(this.layers.get('floorplans'));

      this.isInitialized = true;
      Utils.log('info', 'Map initialized successfully');
      
      // Show success notification
      Utils.showNotification('success', 'Map Loaded', 'Interactive map is ready for use');
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.initialize');
      throw error;
    }
  }

  /**
   * Create base map layers (satellite, street, hybrid)
   */
  createBaseLayers() {
    // Satellite layer
    const satelliteLayer = new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: CONFIG.MAP.TILE_SOURCES.SATELLITE.url,
        attributions: CONFIG.MAP.TILE_SOURCES.SATELLITE.attribution,
        maxZoom: CONFIG.MAP.MAX_ZOOM,
        crossOrigin: 'anonymous',
      }),
      visible: true,
    });

    // Street layer
    const streetLayer = new ol.layer.Tile({
      source: new ol.source.OSM({
        url: CONFIG.MAP.TILE_SOURCES.STREET.url,
        attributions: CONFIG.MAP.TILE_SOURCES.STREET.attribution,
        maxZoom: CONFIG.MAP.MAX_ZOOM,
        crossOrigin: 'anonymous',
      }),
      visible: false,
    });

    // Hybrid layer (satellite + labels)
    const hybridLayer = new ol.layer.Group({
      layers: [
        new ol.layer.Tile({
          source: new ol.source.XYZ({
            url: CONFIG.MAP.TILE_SOURCES.HYBRID.url,
            attributions: CONFIG.MAP.TILE_SOURCES.HYBRID.attribution,
            maxZoom: CONFIG.MAP.MAX_ZOOM,
            crossOrigin: 'anonymous',
          }),
        }),
        new ol.layer.Tile({
          source: new ol.source.XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            attributions: '© Esri',
            maxZoom: CONFIG.MAP.MAX_ZOOM,
            crossOrigin: 'anonymous',
          }),
        }),
      ],
      visible: false,
    });

    this.layers.set('satellite', satelliteLayer);
    this.layers.set('street', streetLayer);
    this.layers.set('hybrid', hybridLayer);
  }

  /**
   * Create vector layers for areas and floor plans
   */
  createVectorLayers() {
    // Areas layer (for selected areas)
    const areasSource = new ol.source.Vector();
    const areasLayer = new ol.layer.Vector({
      source: areasSource,
      style: this.createAreaStyle(),
      zIndex: 10,
    });

    // Floor plans layer
    const floorplansSource = new ol.source.Vector();
    const floorplansLayer = new ol.layer.Vector({
      source: floorplansSource,
      zIndex: 20,
    });

    this.layers.set('areas', areasLayer);
    this.layers.set('floorplans', floorplansLayer);
  }

  /**
   * Create style function for area features
   * @returns {Function} OpenLayers style function
   */
  createAreaStyle() {
    return (feature, resolution) => {
      const isSelected = feature.get('selected');
      const isHovered = feature.get('hovered');
      
      let strokeColor = CONFIG.SELECTION.STROKE_COLOR;
      let strokeWidth = CONFIG.SELECTION.STROKE_WIDTH;
      let fillColor = CONFIG.SELECTION.FILL_COLOR;
      
      if (isSelected) {
        strokeColor = CONFIG.SELECTION.SELECTED_STROKE_COLOR;
        strokeWidth = CONFIG.SELECTION.SELECTED_STROKE_WIDTH;
        fillColor = CONFIG.SELECTION.SELECTED_FILL_COLOR;
      } else if (isHovered) {
        strokeColor = CONFIG.SELECTION.HOVER_STROKE_COLOR;
        strokeWidth = CONFIG.SELECTION.HOVER_STROKE_WIDTH;
        fillColor = CONFIG.SELECTION.HOVER_FILL_COLOR;
      }

      return new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: strokeColor,
          width: strokeWidth,
          lineDash: isSelected ? [] : [5, 5],
        }),
        fill: new ol.style.Fill({
          color: fillColor,
        }),
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: strokeColor,
          }),
          stroke: new ol.style.Stroke({
            color: '#ffffff',
            width: 2,
          }),
        }),
      });
    };
  }

  /**
   * Setup map event listeners
   */
  setupEventListeners() {
    // Map click events
    this.map.on('click', this.handleMapClick);
    
    // Map move events
    this.map.on('moveend', this.handleMapMove);
    this.view.on('change:center', this.updateCoordinateDisplay);
    this.view.on('change:resolution', this.updateCoordinateDisplay);
    
    // Pointer move for hover effects
    this.map.on('pointermove', (event) => {
      const feature = this.map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
      
      // Update cursor
      this.map.getTargetElement().style.cursor = feature ? 'pointer' : '';
      
      // Handle area hover
      this.handleAreaHover(feature);
    });

    // Handle map loading events
    this.layers.forEach((layer, key) => {
      if (layer.getSource && layer.getSource().on) {
        layer.getSource().on('tileloadstart', () => {
          Utils.log('debug', `Loading tiles for ${key} layer`);
        });
        
        layer.getSource().on('tileloadend', () => {
          Utils.log('debug', `Finished loading tiles for ${key} layer`);
        });
        
        layer.getSource().on('tileloaderror', (event) => {
          Utils.log('warn', `Failed to load tile for ${key} layer:`, event);
        });
      }
    });
  }

  /**
   * Handle map click events
   * @param {ol.MapBrowserEvent} event - OpenLayers map event
   */
  handleMapClick(event) {
    const coordinate = event.coordinate;
    const lonLat = ol.proj.toLonLat(coordinate);
    
    Utils.log('debug', 'Map clicked at:', lonLat);
    
    // Check if clicking on a feature
    const feature = this.map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
    
    if (feature) {
      this.handleFeatureClick(feature, event);
    } else {
      // Emit custom event for other modules to handle
      document.dispatchEvent(new CustomEvent('mapClick', {
        detail: { coordinate, lonLat, originalEvent: event }
      }));
    }
  }

  /**
   * Handle feature click events
   * @param {ol.Feature} feature - Clicked feature
   * @param {ol.MapBrowserEvent} event - Original map event
   */
  handleFeatureClick(feature, event) {
    const featureType = feature.get('type');
    
    switch (featureType) {
      case 'area':
        this.selectArea(feature);
        break;
      case 'floorplan':
        this.selectFloorPlan(feature);
        break;
      default:
        Utils.log('debug', 'Clicked on unknown feature type:', featureType);
    }
  }

  /**
   * Handle area hover effects
   * @param {ol.Feature|null} feature - Hovered feature
   */
  handleAreaHover(feature) {
    // Clear previous hover states
    this.layers.get('areas').getSource().getFeatures().forEach(f => {
      f.set('hovered', false);
    });

    // Set hover state on current feature
    if (feature && feature.get('type') === 'area') {
      feature.set('hovered', true);
      
      // Show tooltip with area information
      this.showAreaTooltip(feature);
    } else {
      this.hideAreaTooltip();
    }
  }

  /**
   * Handle map move events
   */
  handleMapMove() {
    this.updateCoordinateDisplay();
    
    // Emit custom event
    document.dispatchEvent(new CustomEvent('mapMove', {
      detail: {
        center: this.view.getCenter(),
        zoom: this.view.getZoom(),
        extent: this.view.calculateExtent()
      }
    }));
  }

  /**
   * Update coordinate display in UI
   */
  updateCoordinateDisplay() {
    const center = this.view.getCenter();
    const lonLat = ol.proj.toLonLat(center);
    const zoom = Math.round(this.view.getZoom() * 10) / 10;
    
    const coordsElement = document.getElementById('current-coords');
    const zoomElement = document.getElementById('current-zoom');
    
    if (coordsElement) {
      coordsElement.textContent = Utils.formatCoordinates(lonLat, 4);
    }
    
    if (zoomElement) {
      zoomElement.textContent = zoom.toString();
    }
  }

  /**
   * Switch base layer
   * @param {string} layerType - Type of layer (satellite, street, hybrid)
   */
  switchBaseLayer(layerType) {
    if (!this.layers.has(layerType)) {
      Utils.log('warn', `Base layer '${layerType}' not found`);
      return;
    }

    try {
      // Hide current base layer
      if (this.layers.has(this.currentBaseLayer)) {
        this.layers.get(this.currentBaseLayer).setVisible(false);
      }

      // Show new base layer
      this.layers.get(layerType).setVisible(true);
      this.currentBaseLayer = layerType;

      Utils.log('info', `Switched to ${layerType} base layer`);
      Utils.showNotification('info', 'Layer Changed', `Switched to ${layerType} view`);
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.switchBaseLayer');
    }
  }

  /**
   * Zoom to specific coordinates
   * @param {Array} coordinates - [longitude, latitude]
   * @param {number} zoom - Zoom level
   * @param {boolean} animate - Whether to animate the transition
   */
  zoomToCoordinates(coordinates, zoom = CONFIG.MAP.DEFAULT_ZOOM, animate = true) {
    if (!Utils.validateCoordinates(coordinates)) {
      Utils.log('warn', 'Invalid coordinates provided:', coordinates);
      return;
    }

    try {
      const center = ol.proj.fromLonLat(coordinates);
      
      if (animate) {
        this.view.animate({
          center: center,
          zoom: zoom,
          duration: CONFIG.MAP.ANIMATION_DURATION,
        });
      } else {
        this.view.setCenter(center);
        this.view.setZoom(zoom);
      }

      Utils.log('info', `Zoomed to coordinates: ${coordinates} at zoom level ${zoom}`);
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.zoomToCoordinates');
    }
  }

  /**
   * Zoom to fit extent
   * @param {Array} extent - Extent to fit [minX, minY, maxX, maxY]
   * @param {boolean} animate - Whether to animate the transition
   */
  zoomToExtent(extent, animate = true) {
    try {
      const transformedExtent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
      
      if (animate) {
        this.view.fit(transformedExtent, {
          duration: CONFIG.MAP.ANIMATION_DURATION,
          padding: [50, 50, 50, 50],
        });
      } else {
        this.view.fit(transformedExtent, {
          padding: [50, 50, 50, 50],
        });
      }

      Utils.log('info', 'Zoomed to extent:', extent);
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.zoomToExtent');
    }
  }

  /**
   * Zoom in by one level
   */
  zoomIn() {
    const currentZoom = this.view.getZoom();
    const newZoom = Math.min(currentZoom + 1, CONFIG.MAP.MAX_ZOOM);
    
    this.view.animate({
      zoom: newZoom,
      duration: CONFIG.MAP.ANIMATION_DURATION,
    });
  }

  /**
   * Zoom out by one level
   */
  zoomOut() {
    const currentZoom = this.view.getZoom();
    const newZoom = Math.max(currentZoom - 1, CONFIG.MAP.MIN_ZOOM);
    
    this.view.animate({
      zoom: newZoom,
      duration: CONFIG.MAP.ANIMATION_DURATION,
    });
  }

  /**
   * Fit map to show all features
   */
  fitToFeatures() {
    try {
      const areasSource = this.layers.get('areas').getSource();
      const floorplansSource = this.layers.get('floorplans').getSource();
      
      const allFeatures = [
        ...areasSource.getFeatures(),
        ...floorplansSource.getFeatures()
      ];

      if (allFeatures.length === 0) {
        Utils.showNotification('info', 'No Features', 'No areas or floor plans to fit to view');
        return;
      }

      const extent = new ol.extent.createEmpty();
      allFeatures.forEach(feature => {
        ol.extent.extend(extent, feature.getGeometry().getExtent());
      });

      this.view.fit(extent, {
        duration: CONFIG.MAP.ANIMATION_DURATION,
        padding: [100, 100, 100, 100],
        maxZoom: CONFIG.FLOOR_PLANS.AUTO_FIT_MAX_ZOOM,
      });

      Utils.log('info', 'Fitted map to all features');
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.fitToFeatures');
    }
  }

  /**
   * Add an area feature to the map
   * @param {ol.geom.Geometry} geometry - Area geometry
   * @param {object} properties - Feature properties
   * @returns {ol.Feature} Created feature
   */
  addArea(geometry, properties = {}) {
    try {
      const feature = new ol.Feature({
        geometry: geometry,
        type: 'area',
        id: Utils.generateId(),
        created: Utils.getCurrentTimestamp(),
        ...properties
      });

      this.layers.get('areas').getSource().addFeature(feature);
      
      // Calculate and store area measurements
      const area = this.calculateFeatureArea(feature);
      const perimeter = this.calculateFeaturePerimeter(feature);
      
      feature.set('area', area);
      feature.set('perimeter', perimeter);

      Utils.log('info', 'Added area feature:', feature.getId());
      
      return feature;
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.addArea');
      return null;
    }
  }

  /**
   * Remove an area feature from the map
   * @param {ol.Feature} feature - Feature to remove
   */
  removeArea(feature) {
    try {
      this.layers.get('areas').getSource().removeFeature(feature);
      Utils.log('info', 'Removed area feature:', feature.getId());
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.removeArea');
    }
  }

  /**
   * Clear all area features
   */
  clearAreas() {
    try {
      this.layers.get('areas').getSource().clear();
      Utils.log('info', 'Cleared all area features');
      Utils.showNotification('info', 'Areas Cleared', 'All selected areas have been removed');
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.clearAreas');
    }
  }

  /**
   * Select an area feature
   * @param {ol.Feature} feature - Feature to select
   */
  selectArea(feature) {
    try {
      // Clear previous selections
      this.layers.get('areas').getSource().getFeatures().forEach(f => {
        f.set('selected', false);
      });

      // Select the new feature
      feature.set('selected', true);

      // Emit custom event
      document.dispatchEvent(new CustomEvent('areaSelected', {
        detail: { feature }
      }));

      Utils.log('info', 'Selected area:', feature.getId());
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.selectArea');
    }
  }

  /**
   * Add a floor plan overlay
   * @param {string} imageUrl - URL of the floor plan image
   * @param {Array} extent - Geographic extent [minX, minY, maxX, maxY]
   * @param {object} options - Floor plan options
   * @returns {ol.layer.Image} Created floor plan layer
   */
  addFloorPlan(imageUrl, extent, options = {}) {
    try {
      const {
        opacity = CONFIG.FLOOR_PLANS.DEFAULT_OPACITY,
        rotation = CONFIG.FLOOR_PLANS.DEFAULT_ROTATION,
        name = 'Floor Plan',
        id = Utils.generateId()
      } = options;

      // Transform extent to map projection
      const transformedExtent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

      // Create image layer
      const imageLayer = new ol.layer.Image({
        source: new ol.source.ImageStatic({
          url: imageUrl,
          imageExtent: transformedExtent,
          crossOrigin: 'anonymous',
        }),
        opacity: opacity,
        zIndex: CONFIG.FLOOR_PLANS.DEFAULT_Z_INDEX,
      });

      // Store metadata
      imageLayer.set('type', 'floorplan');
      imageLayer.set('id', id);
      imageLayer.set('name', name);
      imageLayer.set('originalExtent', extent);
      imageLayer.set('rotation', rotation);
      imageLayer.set('created', Utils.getCurrentTimestamp());

      // Add to map
      this.map.addLayer(imageLayer);

      Utils.log('info', `Added floor plan: ${name}`, { id, extent, options });
      Utils.showNotification('success', 'Floor Plan Added', `${name} has been added to the map`);

      return imageLayer;
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.addFloorPlan');
      return null;
    }
  }

  /**
   * Remove a floor plan overlay
   * @param {string} id - Floor plan ID
   */
  removeFloorPlan(id) {
    try {
      const layers = this.map.getLayers().getArray();
      const floorPlanLayer = layers.find(layer => 
        layer.get('type') === 'floorplan' && layer.get('id') === id
      );

      if (floorPlanLayer) {
        this.map.removeLayer(floorPlanLayer);
        Utils.log('info', `Removed floor plan: ${id}`);
        Utils.showNotification('info', 'Floor Plan Removed', 'Floor plan has been removed from the map');
      }
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.removeFloorPlan');
    }
  }

  /**
   * Update floor plan properties
   * @param {string} id - Floor plan ID
   * @param {object} properties - Properties to update
   */
  updateFloorPlan(id, properties) {
    try {
      const layers = this.map.getLayers().getArray();
      const floorPlanLayer = layers.find(layer => 
        layer.get('type') === 'floorplan' && layer.get('id') === id
      );

      if (!floorPlanLayer) {
        Utils.log('warn', `Floor plan not found: ${id}`);
        return;
      }

      // Update opacity
      if (properties.opacity !== undefined) {
        floorPlanLayer.setOpacity(properties.opacity);
      }

      // Update visibility
      if (properties.visible !== undefined) {
        floorPlanLayer.setVisible(properties.visible);
      }

      // Update z-index
      if (properties.zIndex !== undefined) {
        floorPlanLayer.setZIndex(properties.zIndex);
      }

      // Store updated properties
      Object.keys(properties).forEach(key => {
        floorPlanLayer.set(key, properties[key]);
      });

      Utils.log('info', `Updated floor plan: ${id}`, properties);
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.updateFloorPlan');
    }
  }

  /**
   * Toggle layer visibility
   * @param {string} layerName - Name of the layer to toggle
   */
  toggleLayer(layerName) {
    try {
      const layer = this.layers.get(layerName);
      if (!layer) {
        Utils.log('warn', `Layer not found: ${layerName}`);
        return;
      }

      const isVisible = layer.getVisible();
      layer.setVisible(!isVisible);

      Utils.log('info', `Toggled layer ${layerName}: ${!isVisible ? 'visible' : 'hidden'}`);
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.toggleLayer');
    }
  }

  /**
   * Show area tooltip
   * @param {ol.Feature} feature - Area feature
   */
  showAreaTooltip(feature) {
    const area = feature.get('area');
    const name = feature.get('name') || 'Selected Area';
    
    if (area) {
      const formattedArea = Utils.formatArea(area.raw);
      const tooltipContent = `
        <div class="area-tooltip">
          <strong>${name}</strong><br>
          Area: ${formattedArea.metric} (${formattedArea.imperial})
        </div>
      `;
      
      // Create or update tooltip overlay
      if (!this.overlays.has('tooltip')) {
        const tooltipOverlay = new ol.Overlay({
          element: document.createElement('div'),
          positioning: 'bottom-center',
          stopEvent: false,
          offset: [0, -10],
        });
        
        this.map.addOverlay(tooltipOverlay);
        this.overlays.set('tooltip', tooltipOverlay);
      }
      
      const tooltip = this.overlays.get('tooltip');
      tooltip.getElement().innerHTML = tooltipContent;
      tooltip.setPosition(feature.getGeometry().getInteriorPoint().getCoordinates());
    }
  }

  /**
   * Hide area tooltip
   */
  hideAreaTooltip() {
    const tooltip = this.overlays.get('tooltip');
    if (tooltip) {
      tooltip.setPosition(undefined);
    }
  }

  /**
   * Calculate feature area
   * @param {ol.Feature} feature - Feature to calculate area for
   * @returns {object} Area information
   */
  calculateFeatureArea(feature) {
    try {
      const geometry = feature.getGeometry();
      const area = ol.sphere.getArea(geometry);
      return Utils.formatArea(area);
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.calculateFeatureArea');
      return { metric: '0 m²', imperial: '0 ft²', raw: 0 };
    }
  }

  /**
   * Calculate feature perimeter
   * @param {ol.Feature} feature - Feature to calculate perimeter for
   * @returns {object} Perimeter information
   */
  calculateFeaturePerimeter(feature) {
    try {
      const geometry = feature.getGeometry();
      const length = ol.sphere.getLength(geometry);
      return Utils.formatDistance(length);
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.calculateFeaturePerimeter');
      return { metric: '0 m', imperial: '0 ft', raw: 0 };
    }
  }

  /**
   * Get all floor plan layers
   * @returns {Array} Array of floor plan layers
   */
  getFloorPlanLayers() {
    return this.map.getLayers().getArray().filter(layer => 
      layer.get('type') === 'floorplan'
    );
  }

  /**
   * Get all area features
   * @returns {Array} Array of area features
   */
  getAreaFeatures() {
    return this.layers.get('areas').getSource().getFeatures();
  }

  /**
   * Export map as image
   * @param {string} format - Export format (png, jpeg)
   * @param {number} quality - Image quality (0-1)
   * @returns {Promise<string>} Promise that resolves with data URL
   */
  async exportMap(format = 'png', quality = 0.9) {
    return new Promise((resolve, reject) => {
      try {
        this.map.once('rendercomplete', () => {
          const mapCanvas = document.querySelector('#map canvas');
          if (!mapCanvas) {
            reject(new Error('Map canvas not found'));
            return;
          }

          const dataURL = mapCanvas.toDataURL(`image/${format}`, quality);
          resolve(dataURL);
        });

        // Trigger a render
        this.map.renderSync();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get current map state
   * @returns {object} Current map state
   */
  getMapState() {
    const center = ol.proj.toLonLat(this.view.getCenter());
    const zoom = this.view.getZoom();
    const rotation = this.view.getRotation();
    
    return {
      center,
      zoom,
      rotation,
      baseLayer: this.currentBaseLayer,
      areas: this.getAreaFeatures().map(feature => ({
        id: feature.get('id'),
        geometry: feature.getGeometry().getCoordinates(),
        properties: feature.getProperties()
      })),
      floorPlans: this.getFloorPlanLayers().map(layer => ({
        id: layer.get('id'),
        name: layer.get('name'),
        opacity: layer.getOpacity(),
        visible: layer.getVisible(),
        extent: layer.get('originalExtent')
      }))
    };
  }

  /**
   * Restore map state
   * @param {object} state - Map state to restore
   */
  restoreMapState(state) {
    try {
      // Restore view
      if (state.center && state.zoom) {
        this.zoomToCoordinates(state.center, state.zoom, false);
      }

      // Restore base layer
      if (state.baseLayer) {
        this.switchBaseLayer(state.baseLayer);
      }

      // Restore areas
      if (state.areas) {
        this.clearAreas();
        state.areas.forEach(areaData => {
          const geometry = new ol.geom.Polygon(areaData.geometry);
          this.addArea(geometry, areaData.properties);
        });
      }

      Utils.log('info', 'Restored map state');
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.restoreMapState');
    }
  }

  /**
   * Perform geocoding search
   * @param {string} query - Search query
   * @returns {Promise<Array>} Promise that resolves with search results
   */
  async geocodeSearch(query) {
    if (!CONFIG.FEATURES.ENABLE_GEOCODING) {
      return [];
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${CONFIG.API.ENDPOINTS.GEOCODING}?format=json&q=${encodedQuery}&limit=5&addressdetails=1`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status}`);
      }

      const results = await response.json();
      
      return results.map(result => ({
        id: result.place_id,
        name: result.display_name,
        coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
        type: result.type,
        importance: result.importance,
        boundingBox: result.boundingbox ? [
          parseFloat(result.boundingbox[2]), // west
          parseFloat(result.boundingbox[0]), // south
          parseFloat(result.boundingbox[3]), // east
          parseFloat(result.boundingbox[1])  // north
        ] : null
      }));
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.geocodeSearch');
      return [];
    }
  }

  /**
   * Get map instance
   * @returns {ol.Map} OpenLayers map instance
   */
  getMap() {
    return this.map;
  }

  /**
   * Get map view
   * @returns {ol.View} OpenLayers view instance
   */
  getView() {
    return this.view;
  }

  /**
   * Check if map is initialized
   * @returns {boolean} True if map is initialized
   */
  isMapInitialized() {
    return this.isInitialized;
  }

  /**
   * Destroy the map and clean up resources
   */
  destroy() {
    try {
      if (this.map) {
        this.map.setTarget(null);
        this.map = null;
      }
      
      this.view = null;
      this.layers.clear();
      this.overlays.clear();
      this.isInitialized = false;
      
      Utils.log('info', 'Map destroyed and resources cleaned up');
      
    } catch (error) {
      Utils.handleError(error, 'MapManager.destroy');
    }
  }
}

// Export MapManager class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapManager;
} else if (typeof window !== 'undefined') {
  window.MapManager = MapManager;
}