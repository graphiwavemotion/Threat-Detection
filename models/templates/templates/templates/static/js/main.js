// Main JavaScript file for the Facial Emotion Detection app

// DOM Elements
const sourceOptions = document.querySelectorAll('input[name="source-options"]');
const webcamOption = document.getElementById('webcam-option');
const uploadOption = document.getElementById('upload-option');
const webcamContainer = document.getElementById('webcam-container');
const uploadContainer = document.getElementById('upload-container');
const resultsContainer = document.getElementById('results-container');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');
const noFacesMessage = document.getElementById('no-faces-message');

// Webcam elements
const webcamElement = document.getElementById('webcam');
const startWebcamBtn = document.getElementById('start-webcam-btn');
const captureWebcamBtn = document.getElementById('capture-webcam-btn');
const outputCanvas = document.getElementById('output-canvas');
const outputContext = outputCanvas.getContext('2d');

// Upload elements
const imageUpload = document.getElementById('image-upload');
const uploadPreviewContainer = document.getElementById('upload-preview-container');
const uploadPreview = document.getElementById('upload-preview');
const analyzeImageBtn = document.getElementById('analyze-image-btn');

// Results elements
const resultsTableBody = document.getElementById('results-table-body');

// Global variables
let webcamStream = null;
let isWebcamActive = false;

// Event listeners
document.addEventListener('DOMContentLoaded', initApp);

// Functions
function initApp() {
    // Add event listeners
    sourceOptions.forEach(option => {
        option.addEventListener('change', toggleSourceOption);
    });
    
    startWebcamBtn.addEventListener('click', toggleWebcam);
    captureWebcamBtn.addEventListener('click', captureAndAnalyze);
    imageUpload.addEventListener('change', handleImageUpload);
    analyzeImageBtn.addEventListener('click', analyzeUploadedImage);
    
    // Set the default view
    toggleSourceOption();
}

function toggleSourceOption() {
    if (webcamOption.checked) {
        webcamContainer.classList.remove('d-none');
        uploadContainer.classList.add('d-none');
    } else {
        webcamContainer.classList.add('d-none');
        uploadContainer.classList.remove('d-none');
    }
    
    // Reset results and errors
    resultsContainer.classList.add('d-none');
    errorContainer.classList.add('d-none');
}

async function toggleWebcam() {
    if (isWebcamActive) {
        // Stop webcam
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
        }
        
        webcamElement.srcObject = null;
        startWebcamBtn.innerHTML = '<i class="fas fa-play-circle me-2"></i>Start Webcam';
        captureWebcamBtn.disabled = true;
        isWebcamActive = false;
        
        // Clear canvas
        outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    } else {
        // Start webcam
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            webcamElement.srcObject = webcamStream;
            
            // Wait for the video to be initialized
            await new Promise(resolve => {
                webcamElement.onloadedmetadata = () => {
                    resolve();
                };
            });
            
            // Update button and state
            startWebcamBtn.innerHTML = '<i class="fas fa-stop-circle me-2"></i>Stop Webcam';
            captureWebcamBtn.disabled = false;
            isWebcamActive = true;
            
            // Set canvas dimensions to match video
            outputCanvas.width = webcamElement.videoWidth;
            outputCanvas.height = webcamElement.videoHeight;
            
            // Display initial feed on canvas
            outputContext.drawImage(webcamElement, 0, 0);
        } catch (error) {
            showError(`Error accessing webcam: ${error.message}`);
        }
    }
}

function captureAndAnalyze() {
    if (!isWebcamActive) return;
    
    try {
        // Capture current frame from webcam
        outputContext.drawImage(webcamElement, 0, 0, outputCanvas.width, outputCanvas.height);
        
        // Convert canvas to data URL
        const imageData = outputCanvas.toDataURL('image/jpeg');
        
        // Process the image
        processImage(imageData);
    } catch (error) {
        showError(`Error capturing image: ${error.message}`);
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showError('Please select an image file (JPEG, PNG, etc.)');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        uploadPreview.src = e.target.result;
        uploadPreviewContainer.classList.remove('d-none');
        analyzeImageBtn.classList.remove('d-none');
    };
    
    reader.onerror = function() {
        showError('Error reading the image file');
    };
    
    reader.readAsDataURL(file);
}

function analyzeUploadedImage() {
    if (!uploadPreview.src) return;
    
    // Process the image
    processImage(uploadPreview.src);
}

async function processImage(imageData) {
    try {
        // Show loading state
        const originalButtonText = webcamOption.checked 
            ? captureWebcamBtn.innerHTML 
            : analyzeImageBtn.innerHTML;
            
        if (webcamOption.checked) {
            captureWebcamBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            captureWebcamBtn.disabled = true;
        } else {
            analyzeImageBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            analyzeImageBtn.disabled = true;
        }
        
        // Reset results and errors
        resultsContainer.classList.add('d-none');
        errorContainer.classList.add('d-none');
        
        // Send the image to the server for processing
        const response = await fetch('/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server error');
        }
        
        const result = await response.json();
        
        // Display the results
        displayResults(result);
    } catch (error) {
        showError(`Error processing image: ${error.message}`);
    } finally {
        // Reset button state
        if (webcamOption.checked) {
            captureWebcamBtn.innerHTML = '<i class="fas fa-camera me-2"></i>Capture and Analyze';
            captureWebcamBtn.disabled = false;
        } else {
            analyzeImageBtn.innerHTML = '<i class="fas fa-search me-2"></i>Analyze Image';
            analyzeImageBtn.disabled = false;
        }
    }
}

function displayResults(result) {
    // Clear previous results
    resultsTableBody.innerHTML = '';
    
    // Check if there are any emotions detected
    if (!result.emotions || result.emotions.length === 0) {
        noFacesMessage.classList.remove('d-none');
        resultsContainer.classList.remove('d-none');
        return;
    }
    
    // Hide no faces message
    noFacesMessage.classList.add('d-none');
    
    // Display the processed image
    if (result.result_image) {
        const img = new Image();
        img.onload = function() {
            // For webcam, update the output canvas
            if (webcamOption.checked) {
                outputCanvas.width = img.width;
                outputCanvas.height = img.height;
                outputContext.drawImage(img, 0, 0);
            }
        };
        img.src = result.result_image;
    }
    
    // Create table rows for each detected face
    result.emotions.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        // Extract face from the image based on position
        let faceImg = '';
        if (result.result_image) {
            faceImg = `
                <img src="${result.result_image}" class="face-thumbnail" 
                    style="object-position: -${item.position.x}px -${item.position.y}px;" alt="Face ${index + 1}">
            `;
        }
        
        // Get emotion color class
        const emotionClass = `emotion-${item.emotion.toLowerCase()}`;
        
        tr.innerHTML = `
            <th scope="row">${index + 1}</th>
            <td>${faceImg}</td>
            <td class="${emotionClass}">${item.emotion}</td>
            <td>${(item.confidence * 100).toFixed(2)}%</td>
        `;
        
        resultsTableBody.appendChild(tr);
    });
    
    // Show results container
    resultsContainer.classList.remove('d-none');
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('d-none');
    errorContainer.scrollIntoView({ behavior: 'smooth' });
}