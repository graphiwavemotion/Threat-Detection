import os
import logging
from flask import Flask, render_template, request, jsonify
import base64
import numpy as np
import cv2
from utils.emotion_detector import EmotionDetector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Initialize the emotion detector
emotion_detector = EmotionDetector()

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/about')
def about():
    """Render the about page"""
    return render_template('about.html')

@app.route('/detect', methods=['POST'])
def detect_emotion():
    """Process the image and detect emotions"""
    try:
        # Get the image data from the request
        image_data = request.json.get('image')
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Remove the data:image/jpeg;base64, prefix
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'error': 'Failed to decode image'}), 400
        
        # Process the image to detect emotions
        result_img, emotions_data = emotion_detector.detect_emotions(img)
        
        # Encode the result image back to base64
        _, buffer = cv2.imencode('.jpg', result_img)
        result_image_data = base64.b64encode(buffer).decode('utf-8')
        
        # Return the results
        return jsonify({
            'result_image': f'data:image/jpeg;base64,{result_image_data}',
            'emotions': emotions_data
        })
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)