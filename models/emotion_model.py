import numpy as np

def mock_emotion_prediction(face_image):
    """
    This is a mock function that simulates an emotion prediction model
    
    In a real application, you would replace this with a trained model.
    
    Args:
        face_image: Preprocessed face image (48x48 grayscale)
        
    Returns:
        An array of probabilities for each emotion class
    """
    # Create a random distribution of probabilities
    emotion_probs = np.random.random(7)
    
    # Normalize to create a probability distribution
    emotion_probs = emotion_probs / np.sum(emotion_probs)
    
    return emotion_probs
    
def get_emotion_labels():
    """
    Return a list of emotion labels
    
    Returns:
        List of emotion class names
    """
    return ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']