// Fish Identification JavaScript functionality

class FishIdentification {
    constructor() {
        this.form = document.getElementById('fishIdentificationForm');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fishImage');
        this.loadingState = document.getElementById('loadingState');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContent = document.getElementById('resultsContent');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Click to upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
    }
    
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.fileInput.files = files;
            this.updateUploadUI(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.updateUploadUI(file);
        }
    }
    
    updateUploadUI(file) {
        const uploadContent = this.uploadArea.querySelector('.upload-content');
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }
        
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('File size must be less than 10MB.');
            return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadContent.innerHTML = `
                <img src="${e.target.result}" alt="Fish preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-bottom: 1rem;">
                <h5 class="text-success"><i class="fas fa-check-circle"></i> Image Ready</h5>
                <p class="text-muted">File: ${file.name}</p>
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="fishId.resetUpload()">Choose Different Image</button>
            `;
        };
        reader.readAsDataURL(file);
    }
    
    resetUpload() {
        this.fileInput.value = '';
        const uploadContent = this.uploadArea.querySelector('.upload-content');
        uploadContent.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
            <h4>Drag & Drop Your Fish Photo</h4>
            <p class="text-muted">or click to browse</p>
        `;
    }
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.fileInput.files[0]) {
            this.showError('Please select a fish image to identify.');
            return;
        }
        
        this.showLoading();
        
        try {
            const formData = new FormData(this.form);
            
            // Use the correct Node.js API endpoint (without port 3000)
            const response = await fetch('https://blueseasfishing.com/api/identify-fish', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showResults(result);
            } else {
                this.showError(result.error || 'Identification failed. Please try again.');
            }
        } catch (error) {
            console.error('Identification error:', error);
            this.showError('Network error. Please check your connection and try again.');
        }
        
        this.hideLoading();
    }
    
    showLoading() {
        this.form.style.display = 'none';
        this.loadingState.classList.remove('d-none');
        this.resultsSection.classList.add('d-none');
    }
    
    hideLoading() {
        this.form.style.display = 'block';
        this.loadingState.classList.add('d-none');
    }
    
    showResults(result) {
        const confidenceClass = result.confidence >= 0.8 ? 'high' : result.confidence >= 0.5 ? 'medium' : 'low';
        const confidenceColor = result.confidence >= 0.8 ? 'success' : result.confidence >= 0.5 ? 'warning' : 'danger';
        const confidenceIcon = result.confidence >= 0.8 ? 'fas fa-check-circle' : result.confidence >= 0.5 ? 'fas fa-exclamation-triangle' : 'fas fa-question-circle';
        
        let gearHtml = '';
        if (result.recommended_gear && result.recommended_gear.length > 0) {
            gearHtml = `
                <div class="mt-4">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas fa-shopping-cart text-primary me-2"></i>
                        <h5 class="mb-0">Recommended Fishing Gear</h5>
                    </div>
                    <div class="row">
                        ${result.recommended_gear.slice(0, 3).map(gear => `
                            <div class="col-md-4 mb-3">
                                <div class="card h-100 border-0 shadow-sm">
                                    <div class="card-body p-3 text-center">
                                        <img src="${gear.image_url}" alt="${gear.title}" class="mb-2" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                                        <h6 class="card-title mb-1" style="font-size: 0.9rem;">${gear.title}</h6>
                                        <p class="text-success fw-bold mb-2">$${gear.price}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        this.resultsContent.innerHTML = `
            <div class="card border-0 shadow-lg">
                <div class="card-body p-4">
                    <!-- Species Header -->
                    <div class="row align-items-center mb-4">
                        <div class="col-auto">
                            <div class="rounded-circle bg-primary bg-opacity-10 p-3">
                                <i class="fas fa-fish fa-2x text-primary"></i>
                            </div>
                        </div>
                        <div class="col">
                            <h2 class="mb-1 text-primary">${result.species}</h2>
                            <p class="text-muted mb-2 fst-italic">${result.scientific_name}</p>
                            <div class="d-flex align-items-center">
                                <i class="${confidenceIcon} text-${confidenceColor} me-2"></i>
                                <span class="badge bg-${confidenceColor} fs-6">${Math.round(result.confidence * 100)}% Confidence</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Confidence Progress Bar -->
                    <div class="mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-muted">AI Confidence Level</span>
                            <span class="fw-bold">${Math.round(result.confidence * 100)}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-${confidenceColor}" role="progressbar" 
                                 style="width: ${result.confidence * 100}%" 
                                 aria-valuenow="${result.confidence * 100}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Key Information Grid -->
                    <div class="row mb-4">
                        ${result.habitat ? `
                        <div class="col-md-6 mb-3">
                            <div class="bg-light rounded p-3">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-map-marker-alt text-info me-2"></i>
                                    <h6 class="mb-0">Habitat</h6>
                                </div>
                                <p class="mb-0 text-muted">${result.habitat}</p>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${result.size_range ? `
                        <div class="col-md-6 mb-3">
                            <div class="bg-light rounded p-3">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-ruler text-warning me-2"></i>
                                    <h6 class="mb-0">Typical Size</h6>
                                </div>
                                <p class="mb-0 text-muted">${result.size_range}</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${result.key_features && result.key_features.length > 0 ? `
                    <div class="mb-4">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-eye text-info me-2"></i>
                            <h5 class="mb-0">Key Features Identified</h5>
                        </div>
                        <div class="row">
                            ${result.key_features.map(feature => `
                                <div class="col-md-6 mb-2">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        <span>${feature}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${result.fishing_tips ? `
                    <div class="mb-4">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-lightbulb text-warning me-2"></i>
                            <h5 class="mb-0">Pro Fishing Tips</h5>
                        </div>
                        <div class="alert alert-info border-0 bg-info bg-opacity-10">
                            <p class="mb-0">${result.fishing_tips}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${gearHtml}
                    
                    <!-- Action Buttons -->
                    <div class="text-center mt-4 pt-3 border-top">
                        <button type="button" class="btn btn-primary btn-lg me-3" onclick="fishId.identifyAnother()">
                            <i class="fas fa-camera me-2"></i>Identify Another Fish
                        </button>
                        <button type="button" class="btn btn-outline-secondary" onclick="fishId.shareResults()">
                            <i class="fas fa-share me-2"></i>Share Results
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.resultsSection.classList.remove('d-none');
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    identifyAnother() {
        this.resetUpload();
        this.resultsSection.classList.add('d-none');
        this.form.reset();
        this.uploadArea.scrollIntoView({ behavior: 'smooth' });
    }
    
    shareResults() {
        if (navigator.share) {
            navigator.share({
                title: 'Fish Identification Results - BlueSeasFishing.com',
                text: 'Check out this fish I identified using AI!',
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    }
    
    showError(message) {
        // Create or update error alert
        let errorAlert = document.getElementById('errorAlert');
        if (!errorAlert) {
            errorAlert = document.createElement('div');
            errorAlert.id = 'errorAlert';
            this.form.parentNode.insertBefore(errorAlert, this.form);
        }
        
        errorAlert.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div class="flex-grow-1">
                    <strong>Identification Error:</strong> ${message}
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Auto dismiss after 10 seconds
        setTimeout(() => {
            const alert = errorAlert.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => errorAlert.innerHTML = '', 150);
            }
        }, 10000);
        
        // Scroll to error
        errorAlert.scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.fishId = new FishIdentification();
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
