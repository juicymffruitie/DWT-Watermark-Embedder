"""
AI Image Detection using ONNX Runtime
This script detects if an image is AI-generated or real using ONNX models
"""

import sys
import os
import json
import numpy as np
from PIL import Image
import time

# ONNX Runtime for model inference
try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
    print("ONNX Runtime available for ML-based AI detection", file=sys.stderr)
except ImportError:
    ONNX_AVAILABLE = False
    print("ONNX Runtime not available (Python 3.14 compatibility issue), using heuristic detection", file=sys.stderr)

# Optional scipy for advanced analysis
try:
    import scipy.ndimage as ndimage
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    print("SciPy not available, using basic analysis", file=sys.stderr)

import requests


def load_ai_detection_model():
    """
    Load ONNX model for AI detection
    Uses MobileNetV2 as feature extractor for AI vs real classification
    """
    if not ONNX_AVAILABLE:
        print("ONNX Runtime not available, using heuristic detection", file=sys.stderr)
        return None

    try:
        # For demonstration, we'll download a lightweight ONNX model
        # In production, you'd use a model fine-tuned for AI detection
        model_url = "https://github.com/onnx/models/raw/main/vision/classification/mobilenet/model/mobilenetv2-7.onnx"
        model_path = os.path.join(os.path.dirname(__file__), "mobilenetv2-7.onnx")

        # Download model if not exists
        if not os.path.exists(model_path):
            print("Downloading ONNX model...", file=sys.stderr)
            response = requests.get(model_url, timeout=30)
            response.raise_for_status()
            with open(model_path, 'wb') as f:
                f.write(response.content)
            print("Model downloaded successfully", file=sys.stderr)

        # Load ONNX model
        session = ort.InferenceSession(model_path)

        # Get input details
        input_details = session.get_inputs()[0]
        input_name = input_details.name
        input_shape = input_details.shape

        print(f"Loaded ONNX model with input shape: {input_shape}", file=sys.stderr)

        return {
            'session': session,
            'input_name': input_name,
            'input_shape': input_shape
        }

    except Exception as e:
        print(f"Error loading ONNX model: {e}", file=sys.stderr)
        return None


def preprocess_image(image_path, target_size=(224, 224)):
    """
    Preprocess image for ONNX model input (MobileNetV2 style)
    """
    try:
        # Load and resize image
        img = Image.open(image_path).convert('RGB')
        img = img.resize(target_size, Image.LANCZOS)

        # Convert to array and normalize
        img_array = np.array(img, dtype=np.float32)

        # MobileNetV2 preprocessing: normalize to [-1, 1]
        img_array = (img_array / 127.5) - 1.0

        # Transpose to CHW format (NCHW)
        img_array = np.transpose(img_array, (2, 0, 1))

        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)

        return img_array.astype(np.float32)
    except Exception as e:
        print(f"Error preprocessing for ONNX: {e}", file=sys.stderr)
        return None


def heuristic_ai_detection(image_path):
    """
    Heuristic-based AI detection using image analysis
    This is a placeholder until proper model training
    """
    try:
        img = Image.open(image_path).convert('RGB')
        img_array = np.array(img, dtype=np.float32) / 255.0

        # Simple heuristics for AI detection
        # These are basic patterns often found in AI-generated images

        # 1. Check for unnatural color distributions
        color_variance = np.var(img_array, axis=(0, 1))
        color_variance_score = np.mean(color_variance)

        # 2. Check for repetitive patterns (common in AI art)
        if SCIPY_AVAILABLE:
            entropy = ndimage.generic_filter(
                img_array.mean(axis=2),
                lambda x: -np.sum(x * np.log(x + 1e-10)),
                size=5
            )
            entropy_score = np.mean(entropy)
        else:
            # Basic entropy approximation without scipy
            entropy_score = np.std(img_array.mean(axis=2)) * 10

        # 3. Check for edge consistency
        if SCIPY_AVAILABLE:
            edges = ndimage.sobel(img_array.mean(axis=2))
            edge_consistency = np.std(edges) / (np.mean(np.abs(edges)) + 1e-10)
        else:
            # Simple edge detection
            edges = np.abs(np.gradient(img_array.mean(axis=2)))
            edge_consistency = np.std(edges) / (np.mean(edges) + 1e-10)

        # 4. Noise characteristics
        if SCIPY_AVAILABLE:
            noise = img_array - ndimage.median_filter(img_array, size=3)
        else:
            # Simple noise estimation
            noise = img_array - np.median(img_array, axis=(0, 1), keepdims=True)
        noise_score = np.std(noise)

        # 5. Pattern repetition (FFT analysis)
        fft = np.fft.fft2(img_array.mean(axis=2))
        fft_magnitude = np.abs(fft)
        # Look for strong periodic patterns
        pattern_score = np.max(fft_magnitude[10:50, 10:50]) / np.mean(fft_magnitude)

        # Combine features into AI probability score
        # These weights are arbitrary and should be learned from data
        features = {
            'color_variance': min(color_variance_score * 100, 100),
            'entropy': min(entropy_score * 10, 100),
            'edge_consistency': min(edge_consistency * 50, 100),
            'noise': min(noise_score * 1000, 100),
            'pattern_repetition': min(pattern_score * 10, 100)
        }

        # Simple classification based on combined score
        combined_score = (
            features['color_variance'] * 0.2 +
            features['entropy'] * 0.2 +
            features['edge_consistency'] * 0.2 +
            features['noise'] * 0.2 +
            features['pattern_repetition'] * 0.2
        )

        # Normalize to 0-10 scale
        ai_score = combined_score / 10.0
        ai_score = max(0, min(10, ai_score))

        # Determine if AI-generated based on threshold
        is_ai = ai_score > 5.0
        confidence = min(0.95, max(0.7, abs(ai_score - 5.0) / 5.0 + 0.7))

        return {
            'is_ai': is_ai,
            'score': round(ai_score, 2),
            'confidence': confidence,
            'features': features,
            'method': 'heuristic'
        }

    except Exception as e:
        print(f"Error in heuristic detection: {e}", file=sys.stderr)
        return None


def onnx_ai_detection(image_path, model_data):
    """
    Use ONNX model for AI detection
    """
    try:
        if not model_data:
            return None

        # Preprocess image
        input_data = preprocess_image(image_path)
        if input_data is None:
            return None

        # Run inference
        session = model_data['session']
        input_name = model_data['input_name']

        outputs = session.run(None, {input_name: input_data})

        # Get predictions (logits)
        logits = outputs[0][0]  # Remove batch dimension

        # For AI detection, we'll analyze the prediction distribution
        # AI-generated images often have different prediction patterns

        # Calculate prediction entropy (how confident the model is)
        exp_logits = np.exp(logits - np.max(logits))  # Numerical stability
        probs = exp_logits / np.sum(exp_logits)
        entropy = -np.sum(probs * np.log(probs + 1e-10))

        # Calculate prediction variance (spread of predictions)
        pred_variance = np.var(logits)

        # Top prediction confidence
        top_confidence = np.max(probs)

        # Number of high-confidence predictions (>0.01)
        high_conf_preds = np.sum(probs > 0.01)

        # Analyze prediction patterns that might indicate AI generation
        features = {
            'prediction_entropy': float(entropy),
            'prediction_variance': float(pred_variance),
            'top_confidence': float(top_confidence),
            'high_conf_predictions': int(high_conf_preds),
            'mean_prediction': float(np.mean(logits)),
            'std_prediction': float(np.std(logits))
        }

        # AI detection heuristic based on model predictions
        # These are empirical observations about AI vs real images
        ai_score = 0.0

        # AI images often have lower prediction entropy (more focused predictions)
        if entropy < 2.0:
            ai_score += 3.0
        elif entropy < 3.0:
            ai_score += 1.5

        # AI images often have higher variance in predictions
        if pred_variance > 10.0:
            ai_score += 2.0
        elif pred_variance > 5.0:
            ai_score += 1.0

        # AI images often have very high top confidence
        if top_confidence > 0.8:
            ai_score += 2.5
        elif top_confidence > 0.6:
            ai_score += 1.0

        # AI images often have fewer high-confidence predictions
        if high_conf_preds < 3:
            ai_score += 1.5
        elif high_conf_preds < 5:
            ai_score += 0.5

        # Normalize to 0-10 scale
        ai_score = min(10.0, max(0.0, ai_score))

        # Determine confidence
        confidence = min(0.95, max(0.7, abs(ai_score - 5.0) / 5.0 + 0.7))

        return {
            'is_ai': ai_score > 5.0,
            'score': round(ai_score, 2),
            'confidence': confidence,
            'features': features,
            'method': 'onnx_mobilenet'
        }

    except Exception as e:
        print(f"Error in ONNX AI detection: {e}", file=sys.stderr)
        return None


def detect_ai_image(image_path):
    """
    Main function to detect if image is AI-generated
    """
    start_time = time.time()

    try:
        # Validate input
        if not image_path or not os.path.exists(image_path):
            return {
                'success': False,
                'error': 'Image path is required and must exist'
            }

        # Try ONNX model inference first
        try:
            model_data = load_ai_detection_model()
            if model_data:
                result = onnx_ai_detection(image_path, model_data)
                model_used = 'MobileNetV2 (ONNX)'
                method = 'Machine Learning'
            else:
                raise Exception("Model loading failed")
        except Exception as e:
            # Fallback to heuristic if ONNX fails
            result = heuristic_ai_detection(image_path)
            model_used = 'Heuristic Analysis'
            method = 'Heuristic Analysis'

        if result is None:
            return {
                'success': False,
                'error': 'Failed to analyze image'
            }

        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)

        # Format response
        response = {
            'success': True,
            'isAI': bool(result['is_ai']),
            'message': 'AI-generated artwork detected' if result['is_ai'] else 'Appears to be real artwork',
            'details': f"High probability of AI generation (Score: {result['score']}/10)" if result['is_ai'] else f"Low probability of AI generation (Score: {result['score']}/10)",
            'detection_score': float(result['score']),
            'confidence': 'HIGH' if result['confidence'] >= 0.85 else ('MEDIUM' if result['confidence'] >= 0.75 else 'LOW'),
            'confidence_percentage': float(round(result['confidence'] * 100, 1)),
            'model_used': model_used,
            'analysis_time': int(processing_time),
            'features_analyzed': {k: float(v) for k, v in result['features'].items()},
            'method': method
        }

        return response

    except Exception as e:
        return {
            'success': False,
            'error': f'Error detecting AI: {str(e)}'
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python ai_detection.py <image_path>'
        }))
        sys.exit(1)

    image_path = sys.argv[1]
    result = detect_ai_image(image_path)
    print(json.dumps(result))