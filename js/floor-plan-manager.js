/**
 * Floor Plan Manager - Handles floor plan overlays and management
 * Provides functionality for uploading, positioning, and managing floor plans on the map
 */

class FloorPlanManager {
  constructor(mapManager, areaSelectionManager) {
    this.mapManager = mapManager;
    this.areaSelectionManager = areaSelectionManager;
    this.map = mapManager.getMap();
    this.floorPlans = new Map();
    this.activeFloorPlan = null;
    this.uploadQueue = [];
    
    // Bind methods
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    
    this.initialize();
  }

  /**
   * Initialize floor plan manager
   */
  initialize() {
    try {
      this.setupEventListeners();
      this.loadSavedFloorPlans();
      this.updateFloorPlanList();
      
      Utils.log('info', 'Floor plan manager initialized');
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.initialize');
    }
  }

  /**
   * Setup event listeners for floor plan functionality
   */
  setupEventListeners() {
    // Upload button
    const uploadBtn = document.getElementById('upload-floorplan');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => this.showUploadModal());
    }

    // File input
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.addEventListener('change', this.handleFileUpload);
    }

    // Upload area drag and drop
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
      uploadArea.addEventListener('click', () => {
        document.getElementById('file-input').click();
      });
      
      uploadArea.addEventListener('dragover', this.handleDragOver);
      uploadArea.addEventListener('drop', this.handleDrop);
      uploadArea.addEventListener('dragenter', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      });
      uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
      });
    }

    // Upload submit button
    const uploadSubmit = document.getElementById('upload-submit');
    if (uploadSubmit) {
      uploadSubmit.addEventListener('click', () => this.processUploadQueue());
    }

    // Floor plan controls
    this.setupFloorPlanControls();

    // Listen for area selection events
    document.addEventListener('areaSelected', (event) => {
      this.handleAreaSelected(event.detail.feature);
    });
  }

  /**
   * Setup floor plan control sliders and buttons
   */
  setupFloorPlanControls() {
    // Opacity slider
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');
    
    if (opacitySlider && opacityValue) {
      opacitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        opacityValue.textContent = `${value}%`;
        
        if (this.activeFloorPlan) {
          this.updateFloorPlanOpacity(this.activeFloorPlan.id, value / 100);
        }
      });
    }

    // Rotation slider
    const rotationSlider = document.getElementById('rotation-slider');
    const rotationValue = document.getElementById('rotation-value');
    
    if (rotationSlider && rotationValue) {
      rotationSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        rotationValue.textContent = `${value}°`;
        
        if (this.activeFloorPlan) {
          this.updateFloorPlanRotation(this.activeFloorPlan.id, value);
        }
      });
    }

    // Scale slider
    const scaleSlider = document.getElementById('scale-slider');
    const scaleValue = document.getElementById('scale-value');
    
    if (scaleSlider && scaleValue) {
      scaleSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        scaleValue.textContent = `${value}%`;
        
        if (this.activeFloorPlan) {
          this.updateFloorPlanScale(this.activeFloorPlan.id, value / 100);
        }
      });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-floorplan');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetActiveFloorPlan());
    }

    // Fit button
    const fitBtn = document.getElementById('fit-floorplan');
    if (fitBtn) {
      fitBtn.addEventListener('click', () => this.fitFloorPlanToArea());
    }
  }

  /**
   * Show upload modal
   */
  showUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
      modal.classList.add('show');
      
      // Reset form
      document.getElementById('floorplan-name').value = '';
      document.getElementById('floorplan-description').value = '';
      document.getElementById('upload-submit').disabled = true;
      
      // Clear upload queue
      this.uploadQueue = [];
      this.updateUploadPreview();
    }
  }

  /**
   * Handle file upload
   * @param {Event} event - File input change event
   */
  handleFileUpload(event) {
    const files = Array.from(event.target.files);
    this.processFiles(files);
  }

  /**
   * Handle drag over event
   * @param {DragEvent} event - Drag over event
   */
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  /**
   * Handle file drop
   * @param {DragEvent} event - Drop event
   */
  handleDrop(event) {
    event.preventDefault();
    
    const uploadArea = document.getElementById('upload-area');
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(event.dataTransfer.files);
    this.processFiles(files);
  }

  /**
   * Process uploaded files
   * @param {Array} files - Array of File objects
   */
  async processFiles(files) {
    try {
      const validFiles = [];
      const errors = [];

      // Validate each file
      for (const file of files) {
        const validation = Utils.validateFile(file);
        
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation.errors.join(', ')}`);
        }
      }

      // Show validation errors
      if (errors.length > 0) {
        Utils.showNotification('error', 'File Validation Failed', 
          errors.join('\n'));
      }

      // Process valid files
      if (validFiles.length > 0) {
        for (const file of validFiles) {
          await this.addFileToQueue(file);
        }
        
        this.updateUploadPreview();
        document.getElementById('upload-submit').disabled = this.uploadQueue.length === 0;
      }
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.processFiles');
    }
  }

  /**
   * Add file to upload queue
   * @param {File} file - File to add
   */
  async addFileToQueue(file) {
    try {
      const dataUrl = await Utils.fileToDataUrl(file);
      const image = await Utils.loadImage(dataUrl);
      
      const floorPlanData = {
        id: Utils.generateId(),
        file: file,
        dataUrl: dataUrl,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        size: file.size,
        dimensions: {
          width: image.width,
          height: image.height
        },
        created: Utils.getCurrentTimestamp()
      };

      this.uploadQueue.push(floorPlanData);
      
      Utils.log('info', `Added file to upload queue: ${file.name}`);
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.addFileToQueue');
    }
  }

  /**
   * Update upload preview
   */
  updateUploadPreview() {
    const uploadArea = document.getElementById('upload-area');
    const uploadContent = uploadArea.querySelector('.upload-content');
    
    if (this.uploadQueue.length === 0) {
      uploadContent.innerHTML = `
        <i class="fas fa-cloud-upload-alt upload-icon"></i>
        <h4>Drop your floor plan here</h4>
        <p>or click to browse files</p>
        <div class="file-types">
          <span>Supported: JPG, PNG, SVG, PDF</span>
        </div>
      `;
    } else {
      const file = this.uploadQueue[0]; // Show first file
      uploadContent.innerHTML = `
        <div class="file-preview">
          <img src="${file.dataUrl}" alt="${file.name}" style="max-width: 100px; max-height: 100px; border-radius: 8px;">
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-details">${Utils.formatFileSize(file.size)} • ${file.dimensions.width}×${file.dimensions.height}</div>
          </div>
        </div>
        ${this.uploadQueue.length > 1 ? `<p>+${this.uploadQueue.length - 1} more file(s)</p>` : ''}
      `;
    }
  }

  /**
   * Process upload queue
   */
  async processUploadQueue() {
    if (this.uploadQueue.length === 0) return;

    try {
      const name = document.getElementById('floorplan-name').value || this.uploadQueue[0].name;
      const description = document.getElementById('floorplan-description').value || '';

      // Show progress
      this.showUploadProgress();

      for (let i = 0; i < this.uploadQueue.length; i++) {
        const fileData = this.uploadQueue[i];
        
        // Update progress
        const progress = ((i + 1) / this.uploadQueue.length) * 100;
        this.updateUploadProgress(progress, `Processing ${fileData.name}...`);

        // Create floor plan
        const floorPlan = {
          id: fileData.id,
          name: this.uploadQueue.length === 1 ? name : `${name} (${i + 1})`,
          description: description,
          dataUrl: fileData.dataUrl,
          file: fileData.file,
          dimensions: fileData.dimensions,
          created: fileData.created,
          opacity: CONFIG.FLOOR_PLANS.DEFAULT_OPACITY,
          rotation: CONFIG.FLOOR_PLANS.DEFAULT_ROTATION,
          scale: CONFIG.FLOOR_PLANS.DEFAULT_SCALE,
          visible: true,
          extent: null // Will be set when positioned
        };

        this.floorPlans.set(floorPlan.id, floorPlan);
        
        // Simulate processing delay
        await Utils.delay(500);
      }

      // Hide progress and modal
      this.hideUploadProgress();
      this.hideModal('upload-modal');

      // Update UI
      this.updateFloorPlanList();
      this.saveFloorPlansToStorage();

      // Clear queue
      this.uploadQueue = [];

      Utils.showNotification('success', 'Upload Complete', 
        `${this.uploadQueue.length} floor plan(s) uploaded successfully`);
      
    } catch (error) {
      this.hideUploadProgress();
      Utils.handleError(error, 'FloorPlanManager.processUploadQueue');
    }
  }

  /**
   * Show upload progress
   */
  showUploadProgress() {
    const progressContainer = document.getElementById('upload-progress');
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }
  }

  /**
   * Update upload progress
   * @param {number} percent - Progress percentage
   * @param {string} message - Progress message
   */
  updateUploadProgress(percent, message) {
    const progressFill = document.getElementById('upload-progress-fill');
    const progressText = document.getElementById('upload-progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
    
    if (progressText) {
      progressText.textContent = message;
    }
  }

  /**
   * Hide upload progress
   */
  hideUploadProgress() {
    const progressContainer = document.getElementById('upload-progress');
    if (progressContainer) {
      progressContainer.style.display = 'none';
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
    }
  }

  /**
   * Position floor plan on selected area
   * @param {string} floorPlanId - Floor plan ID
   * @param {ol.Feature} areaFeature - Selected area feature
   */
  positionFloorPlan(floorPlanId, areaFeature) {
    try {
      const floorPlan = this.floorPlans.get(floorPlanId);
      if (!floorPlan) {
        Utils.log('warn', `Floor plan not found: ${floorPlanId}`);
        return;
      }

      // Get area extent
      const geometry = areaFeature.getGeometry();
      const extent = geometry.getExtent();
      const lonLatExtent = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');

      // Create floor plan overlay
      const layer = this.mapManager.addFloorPlan(floorPlan.dataUrl, lonLatExtent, {
        id: floorPlan.id,
        name: floorPlan.name,
        opacity: floorPlan.opacity,
        rotation: floorPlan.rotation
      });

      if (layer) {
        floorPlan.extent = lonLatExtent;
        floorPlan.layer = layer;
        floorPlan.positioned = true;

        // Set as active floor plan
        this.setActiveFloorPlan(floorPlan);

        // Show floor plan controls
        this.showFloorPlanControls();

        Utils.showNotification('success', 'Floor Plan Positioned', 
          `${floorPlan.name} has been positioned on the selected area`);
        
        Utils.log('info', `Positioned floor plan: ${floorPlan.name}`, { extent: lonLatExtent });
      }
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.positionFloorPlan');
    }
  }

  /**
   * Set active floor plan
   * @param {object} floorPlan - Floor plan to set as active
   */
  setActiveFloorPlan(floorPlan) {
    this.activeFloorPlan = floorPlan;
    
    // Update control values
    this.updateControlValues();
    
    // Update floor plan list UI
    this.updateFloorPlanList();
    
    // Emit custom event
    document.dispatchEvent(new CustomEvent('floorPlanActivated', {
      detail: { floorPlan }
    }));
  }

  /**
   * Update control slider values
   */
  updateControlValues() {
    if (!this.activeFloorPlan) return;

    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');
    const rotationSlider = document.getElementById('rotation-slider');
    const rotationValue = document.getElementById('rotation-value');
    const scaleSlider = document.getElementById('scale-slider');
    const scaleValue = document.getElementById('scale-value');

    if (opacitySlider && opacityValue) {
      const opacity = Math.round(this.activeFloorPlan.opacity * 100);
      opacitySlider.value = opacity;
      opacityValue.textContent = `${opacity}%`;
    }

    if (rotationSlider && rotationValue) {
      rotationSlider.value = this.activeFloorPlan.rotation;
      rotationValue.textContent = `${this.activeFloorPlan.rotation}°`;
    }

    if (scaleSlider && scaleValue) {
      const scale = Math.round(this.activeFloorPlan.scale * 100);
      scaleSlider.value = scale;
      scaleValue.textContent = `${scale}%`;
    }
  }

  /**
   * Update floor plan opacity
   * @param {string} id - Floor plan ID
   * @param {number} opacity - Opacity value (0-1)
   */
  updateFloorPlanOpacity(id, opacity) {
    const floorPlan = this.floorPlans.get(id);
    if (!floorPlan || !floorPlan.layer) return;

    floorPlan.opacity = opacity;
    floorPlan.layer.setOpacity(opacity);
    
    this.saveFloorPlansToStorage();
    Utils.log('debug', `Updated floor plan opacity: ${id} -> ${opacity}`);
  }

  /**
   * Update floor plan rotation
   * @param {string} id - Floor plan ID
   * @param {number} rotation - Rotation in degrees
   */
  updateFloorPlanRotation(id, rotation) {
    const floorPlan = this.floorPlans.get(id);
    if (!floorPlan || !floorPlan.layer) return;

    floorPlan.rotation = rotation;
    
    // For rotation, we would need to recreate the layer with rotated image
    // This is a simplified implementation
    floorPlan.layer.set('rotation', rotation);
    
    this.saveFloorPlansToStorage();
    Utils.log('debug', `Updated floor plan rotation: ${id} -> ${rotation}°`);
  }

  /**
   * Update floor plan scale
   * @param {string} id - Floor plan ID
   * @param {number} scale - Scale factor
   */
  updateFloorPlanScale(id, scale) {
    const floorPlan = this.floorPlans.get(id);
    if (!floorPlan || !floorPlan.extent) return;

    floorPlan.scale = scale;
    
    // Calculate new extent based on scale
    const originalExtent = floorPlan.extent;
    const centerX = (originalExtent[0] + originalExtent[2]) / 2;
    const centerY = (originalExtent[1] + originalExtent[3]) / 2;
    const width = (originalExtent[2] - originalExtent[0]) * scale;
    const height = (originalExtent[3] - originalExtent[1]) * scale;
    
    const newExtent = [
      centerX - width / 2,
      centerY - height / 2,
      centerX + width / 2,
      centerY + height / 2
    ];

    // Update layer extent
    if (floorPlan.layer) {
      const transformedExtent = ol.proj.transformExtent(newExtent, 'EPSG:4326', 'EPSG:3857');
      floorPlan.layer.getSource().setImageExtent(transformedExtent);
    }
    
    this.saveFloorPlansToStorage();
    Utils.log('debug', `Updated floor plan scale: ${id} -> ${scale}`);
  }

  /**
   * Reset active floor plan to default settings
   */
  resetActiveFloorPlan() {
    if (!this.activeFloorPlan) return;

    this.updateFloorPlanOpacity(this.activeFloorPlan.id, CONFIG.FLOOR_PLANS.DEFAULT_OPACITY);
    this.updateFloorPlanRotation(this.activeFloorPlan.id, CONFIG.FLOOR_PLANS.DEFAULT_ROTATION);
    this.updateFloorPlanScale(this.activeFloorPlan.id, CONFIG.FLOOR_PLANS.DEFAULT_SCALE);
    
    this.updateControlValues();
    
    Utils.showNotification('info', 'Floor Plan Reset', 'Floor plan settings have been reset to defaults');
  }

  /**
   * Fit floor plan to selected area
   */
  fitFloorPlanToArea() {
    const selectedArea = this.areaSelectionManager.getSelectedFeature();
    
    if (!this.activeFloorPlan || !selectedArea) {
      Utils.showNotification('warning', 'Cannot Fit', 'Please select both a floor plan and an area');
      return;
    }

    try {
      // Get area extent
      const geometry = selectedArea.getGeometry();
      const extent = geometry.getExtent();
      const lonLatExtent = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');

      // Update floor plan extent
      this.activeFloorPlan.extent = lonLatExtent;

      // Recreate layer with new extent
      if (this.activeFloorPlan.layer) {
        this.mapManager.map.removeLayer(this.activeFloorPlan.layer);
      }

      const layer = this.mapManager.addFloorPlan(
        this.activeFloorPlan.dataUrl, 
        lonLatExtent, 
        {
          id: this.activeFloorPlan.id,
          name: this.activeFloorPlan.name,
          opacity: this.activeFloorPlan.opacity,
          rotation: this.activeFloorPlan.rotation
        }
      );

      this.activeFloorPlan.layer = layer;
      
      Utils.showNotification('success', 'Floor Plan Fitted', 
        'Floor plan has been fitted to the selected area');
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.fitFloorPlanToArea');
    }
  }

  /**
   * Show floor plan controls
   */
  showFloorPlanControls() {
    const controlsPanel = document.getElementById('floorplan-controls');
    if (controlsPanel) {
      controlsPanel.style.display = 'block';
    }
  }

  /**
   * Hide floor plan controls
   */
  hideFloorPlanControls() {
    const controlsPanel = document.getElementById('floorplan-controls');
    if (controlsPanel) {
      controlsPanel.style.display = 'none';
    }
  }

  /**
   * Handle area selection for floor plan positioning
   * @param {ol.Feature} areaFeature - Selected area feature
   */
  handleAreaSelected(areaFeature) {
    if (this.activeFloorPlan && !this.activeFloorPlan.positioned) {
      // Auto-position floor plan on selected area
      this.positionFloorPlan(this.activeFloorPlan.id, areaFeature);
    }
  }

  /**
   * Update floor plan list display
   */
  updateFloorPlanList() {
    const listContainer = document.getElementById('floorplan-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (this.floorPlans.size === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-building"></i>
          <p>No floor plans uploaded</p>
          <small>Upload floor plans to get started</small>
        </div>
      `;
      return;
    }

    this.floorPlans.forEach((floorPlan) => {
      const item = document.createElement('div');
      item.className = `floorplan-item ${this.activeFloorPlan?.id === floorPlan.id ? 'active' : ''}`;
      
      item.innerHTML = `
        <div class="floorplan-thumbnail">
          <img src="${floorPlan.dataUrl}" alt="${floorPlan.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <i class="fas fa-building" style="display: none;"></i>
        </div>
        <div class="floorplan-info">
          <div class="floorplan-name" title="${floorPlan.name}">${floorPlan.name}</div>
          <div class="floorplan-meta">
            <span>${Utils.formatFileSize(floorPlan.file.size)}</span>
            <span>•</span>
            <span>${floorPlan.dimensions.width}×${floorPlan.dimensions.height}</span>
            ${floorPlan.positioned ? '<span class="status-badge positioned">Positioned</span>' : '<span class="status-badge">Not positioned</span>'}
          </div>
        </div>
        <div class="floorplan-actions">
          <button class="action-btn-small" onclick="floorPlanManager.toggleFloorPlanVisibility('${floorPlan.id}')" title="Toggle Visibility">
            <i class="fas fa-eye${floorPlan.visible ? '' : '-slash'}"></i>
          </button>
          <button class="action-btn-small" onclick="floorPlanManager.removeFloorPlan('${floorPlan.id}')" title="Remove">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      // Add click handler to select floor plan
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.floorplan-actions')) {
          this.setActiveFloorPlan(floorPlan);
        }
      });

      listContainer.appendChild(item);
    });
  }

  /**
   * Toggle floor plan visibility
   * @param {string} id - Floor plan ID
   */
  toggleFloorPlanVisibility(id) {
    const floorPlan = this.floorPlans.get(id);
    if (!floorPlan || !floorPlan.layer) return;

    floorPlan.visible = !floorPlan.visible;
    floorPlan.layer.setVisible(floorPlan.visible);
    
    this.updateFloorPlanList();
    this.saveFloorPlansToStorage();
    
    Utils.log('info', `Toggled floor plan visibility: ${id} -> ${floorPlan.visible}`);
  }

  /**
   * Remove floor plan
   * @param {string} id - Floor plan ID
   */
  removeFloorPlan(id) {
    const floorPlan = this.floorPlans.get(id);
    if (!floorPlan) return;

    try {
      // Remove from map
      if (floorPlan.layer) {
        this.mapManager.map.removeLayer(floorPlan.layer);
      }

      // Remove from collection
      this.floorPlans.delete(id);

      // Clear active if this was active
      if (this.activeFloorPlan?.id === id) {
        this.activeFloorPlan = null;
        this.hideFloorPlanControls();
      }

      // Update UI
      this.updateFloorPlanList();
      this.saveFloorPlansToStorage();

      Utils.showNotification('info', 'Floor Plan Removed', `${floorPlan.name} has been removed`);
      Utils.log('info', `Removed floor plan: ${floorPlan.name}`);
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.removeFloorPlan');
    }
  }

  /**
   * Save floor plans to localStorage
   */
  saveFloorPlansToStorage() {
    try {
      const floorPlanData = Array.from(this.floorPlans.values()).map(fp => ({
        id: fp.id,
        name: fp.name,
        description: fp.description,
        dataUrl: fp.dataUrl,
        dimensions: fp.dimensions,
        created: fp.created,
        opacity: fp.opacity,
        rotation: fp.rotation,
        scale: fp.scale,
        visible: fp.visible,
        extent: fp.extent,
        positioned: fp.positioned
      }));

      Utils.storage.save('floorplan-mapper-floorplans', floorPlanData);
      Utils.log('debug', 'Saved floor plans to storage');
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.saveFloorPlansToStorage');
    }
  }

  /**
   * Load saved floor plans from localStorage
   */
  loadSavedFloorPlans() {
    try {
      const savedFloorPlans = Utils.storage.load('floorplan-mapper-floorplans', []);
      
      savedFloorPlans.forEach(fpData => {
        const floorPlan = {
          ...fpData,
          file: null, // File object is not serializable
          layer: null // Will be recreated if needed
        };

        this.floorPlans.set(floorPlan.id, floorPlan);

        // Recreate layer if positioned
        if (floorPlan.positioned && floorPlan.extent) {
          const layer = this.mapManager.addFloorPlan(floorPlan.dataUrl, floorPlan.extent, {
            id: floorPlan.id,
            name: floorPlan.name,
            opacity: floorPlan.opacity,
            rotation: floorPlan.rotation
          });

          if (layer) {
            floorPlan.layer = layer;
            layer.setVisible(floorPlan.visible);
          }
        }
      });

      if (savedFloorPlans.length > 0) {
        Utils.log('info', `Loaded ${savedFloorPlans.length} saved floor plans`);
      }
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.loadSavedFloorPlans');
    }
  }

  /**
   * Export floor plan data
   * @returns {object} Exportable floor plan data
   */
  exportFloorPlans() {
    try {
      const exportData = {
        version: CONFIG.APP.VERSION,
        exported: Utils.getCurrentTimestamp(),
        floorPlans: Array.from(this.floorPlans.values()).map(fp => ({
          id: fp.id,
          name: fp.name,
          description: fp.description,
          dimensions: fp.dimensions,
          created: fp.created,
          opacity: fp.opacity,
          rotation: fp.rotation,
          scale: fp.scale,
          visible: fp.visible,
          extent: fp.extent,
          positioned: fp.positioned
          // Note: dataUrl is excluded to reduce file size
        }))
      };

      return exportData;
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.exportFloorPlans');
      return null;
    }
  }

  /**
   * Get all floor plans
   * @returns {Map} Map of floor plans
   */
  getFloorPlans() {
    return this.floorPlans;
  }

  /**
   * Get active floor plan
   * @returns {object|null} Active floor plan
   */
  getActiveFloorPlan() {
    return this.activeFloorPlan;
  }

  /**
   * Clear all floor plans
   */
  clearAllFloorPlans() {
    try {
      // Remove all layers from map
      this.floorPlans.forEach(floorPlan => {
        if (floorPlan.layer) {
          this.mapManager.map.removeLayer(floorPlan.layer);
        }
      });

      // Clear collection
      this.floorPlans.clear();
      this.activeFloorPlan = null;

      // Update UI
      this.updateFloorPlanList();
      this.hideFloorPlanControls();
      this.saveFloorPlansToStorage();

      Utils.showNotification('info', 'Floor Plans Cleared', 'All floor plans have been removed');
      Utils.log('info', 'Cleared all floor plans');
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.clearAllFloorPlans');
    }
  }

  /**
   * Destroy floor plan manager and clean up
   */
  destroy() {
    try {
      // Clear all floor plans
      this.clearAllFloorPlans();
      
      // Clear references
      this.mapManager = null;
      this.areaSelectionManager = null;
      this.map = null;
      this.uploadQueue = [];

      Utils.log('info', 'Floor plan manager destroyed');
      
    } catch (error) {
      Utils.handleError(error, 'FloorPlanManager.destroy');
    }
  }
}

// Export FloorPlanManager class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FloorPlanManager;
} else if (typeof window !== 'undefined') {
  window.FloorPlanManager = FloorPlanManager;
}