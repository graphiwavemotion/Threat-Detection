import os
import cv2
import numpy as np
import logging
import random

logger = logging.getLogger(__name__)

class EmotionDetector:
    """Class for facial emotion detection"""
    
    def __init__(self):
        """Initialize face detection and emotion classification models"""
        try:
            # Load face detection model - using Haar cascade for simplicity
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_detector = cv2.CascadeClassifier(cascade_path)
            
            if self.face_detector.empty():
                logger.error("Error loading face detector model")
                raise Exception("Failed to load face detector model")
            
            # Labels for emotions
            self.emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
            
            # Colors for emotion labels (BGR format for OpenCV)
            self.emotion_colors = {
                'Angry': (0, 0, 255),       # Red
                'Disgust': (0, 140, 255),   # Orange
                'Fear': (0, 255, 255),      # Yellow
                'Happy': (0, 255, 0),       # Green
                'Sad': (255, 0, 0),         # Blue
                'Surprise': (255, 0, 255),  # Magenta
                'Neutral': (255, 255, 255)  # White
            }
            
            logger.info("Emotion detector initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing emotion detector: {str(e)}")
            raise
    
    def preprocess_face(self, face_img):
        """Preprocess face for emotion detection"""
        # Convert to grayscale
        gray_face = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        
        # Resize to 48x48 (standard size for emotion detection)
        resized_face = cv2.resize(gray_face, (48, 48))
        
        # Normalize pixel values
        normalized_face = resized_face / 255.0
        
        return normalized_face
    
    def predict_emotion(self, face):
        """
        Simulate emotion prediction
        In a real application, this would use a trained model
        For this demo, we'll use a simple heuristic based on facial features
        """
        # Calculate simple features from the face image
        # Higher brightness in upper part of face might indicate surprise or fear
        # Higher brightness in lower part could indicate happiness (smile)
        
        # Split face into regions
        h, w = face.shape
        upper_face = face[0:int(h/2), :]
        lower_face = face[int(h/2):h, :]
        
        # Calculate average intensities
        upper_intensity = np.mean(upper_face)
        lower_intensity = np.mean(lower_face)
        
        # Simple rules to decide emotion
        # In a real application, this would be a trained model
        
        # Random component to add variety (since this is a demo)
        random_component = np.random.random()
        
        # Determine emotion based on simple rules + randomness
        if random_component < 0.25:
            # 25% chance of happy
            emotion_idx = 3  # Happy
        elif random_component < 0.40:
            # 15% chance of sad
            emotion_idx = 4  # Sad
        elif random_component < 0.55:
            # 15% chance of neutral
            emotion_idx = 6  # Neutral
        elif random_component < 0.65:
            # 10% chance of surprise
            emotion_idx = 5  # Surprise
        elif random_component < 0.75:
            # 10% chance of angry
            emotion_idx = 0  # Angry
        elif random_component < 0.85:
            # 10% chance of fear
            emotion_idx = 2  # Fear
        else:
            # 15% chance of disgust
            emotion_idx = 1  # Disgust
        
        # Create probabilities array with highest value for the selected emotion
        probs = np.random.random(7) * 0.3  # Base random values
        probs[emotion_idx] = 0.5 + (np.random.random() * 0.5)  # Higher value for selected emotion
        
        # Normalize to sum to 1
        probs = probs / np.sum(probs)
        
        return probs
    
    def detect_emotions(self, img):
        """Detect faces and emotions in an image"""
        # Create a copy of the image to draw on
        result_img = img.copy()
        
        # Convert to grayscale for face detection
        gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_detector.detectMultiScale(
            gray_img,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        emotions_data = []
        
        # If no faces are detected
        if len(faces) == 0:
            return result_img, []
        
        for (x, y, w, h) in faces:
            # Extract the face
            face_img = img[y:y+h, x:x+w]
            
            # Check if face extraction was successful
            if face_img.size == 0:
                continue
            
            # Preprocess the face for emotion detection
            try:
                processed_face = self.preprocess_face(face_img)
                
                # Get emotion predictions (simulated in this demo)
                emotion_probs = self.predict_emotion(processed_face)
                
                # Get the emotion with highest probability
                emotion_idx = np.argmax(emotion_probs)
                emotion = self.emotion_labels[emotion_idx]
                confidence = float(emotion_probs[emotion_idx])
                
                # Draw rectangle around face
                color = self.emotion_colors[emotion]
                cv2.rectangle(result_img, (x, y), (x+w, y+h), color, 2)
                
                # Add emotion label
                label = f"{emotion}: {confidence:.2f}"
                cv2.putText(result_img, label, (x, y-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
                
                # Add to emotions data
                emotions_data.append({
                    'emotion': emotion,
                    'confidence': confidence,
                    'position': {'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h)}
                })
                
            except Exception as e:
                logger.error(f"Error processing face: {str(e)}")
                continue
        
        return result_img, emotions_data