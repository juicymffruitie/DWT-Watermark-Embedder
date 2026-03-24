"""
AI Artwork Detection Pipeline
This module implements a probabilistic AI-artwork detection system with multiple analysis components.

Components:
1. Neural Detection: Uses Vision Transformer (ViT) model for image classification analysis
2. Metadata Analysis: Examines EXIF data and filenames for suspicious indicators
3. Visual Analysis: Statistical checks for AI generation patterns
4. Ensemble Scoring: Weighted combination of all scores

The neural detection uses a pre-trained ViT model to classify images and analyzes the results
for patterns that might indicate AI generation (e.g., artistic/abstract classifications vs. realistic ones).

Note: For better accuracy, consider using models specifically trained for AI detection.
"""

import numpy as np
from PIL import Image, ExifTags
import json
from typing import Dict, Tuple


def neural_detection(image: Image.Image) -> float:
    """
    Neural Detection Component
    Uses a pre-trained image classification model to analyze image characteristics.

    Args:
        image: PIL Image object

    Returns:
        float: AI probability score (0.0 to 1.0)
    """
    try:
        from transformers import pipeline

        # Use a general image classification pipeline
        # This will classify the image into general categories
        classifier = pipeline("image-classification", model="google/vit-base-patch16-224")

        # Get classification results
        results = classifier(image)

        # Analyze the results for AI-like characteristics
        # AI images often get classified as "artwork", "painting", or abstract categories
        ai_indicators = ['painting', 'artwork', 'drawing', 'illustration', 'digital art']
        real_indicators = ['photograph', 'photo', 'landscape', 'portrait', 'nature']

        ai_score = 0.0
        real_score = 0.0

        for result in results[:5]:  # Top 5 predictions
            label = result['label'].lower()
            confidence = result['score']

            for indicator in ai_indicators:
                if indicator in label:
                    ai_score += confidence
                    break

            for indicator in real_indicators:
                if indicator in label:
                    real_score += confidence
                    break

        # Calculate AI probability
        total = ai_score + real_score
        if total > 0:
            ai_probability = ai_score / total
        else:
            # If no clear indicators, use a heuristic based on top prediction confidence
            top_confidence = results[0]['score'] if results else 0.5
            ai_probability = 1.0 - top_confidence  # Lower confidence might indicate AI

        return float(ai_probability)

    except Exception as e:
        # Fallback to random if model fails to load or process
        print(f"Warning: Image classification model failed, using fallback: {e}")
        np.random.seed(hash(image.tobytes()) % 2**32)
        return float(np.random.uniform(0.0, 1.0))


def metadata_analysis(image: Image.Image, filename: str = None) -> float:
    """
    Metadata & File Analysis Component
    Extracts EXIF metadata and detects suspicious fields indicating AI generation.

    Args:
        image: PIL Image object
        filename: Optional filename to analyze

    Returns:
        float: Metadata score (0.0 to 1.0) indicating likelihood of AI
    """
    score = 0.0
    suspicious_indicators = 0
    total_indicators = 4  # software, creator, filename, format

    try:
        exif_data = image._getexif()
        if exif_data:
            for tag_id, value in exif_data.items():
                tag = ExifTags.TAGS.get(tag_id, tag_id)

                # Check for suspicious software names
                if tag == 'Software':
                    suspicious_software = ['dall-e', 'midjourney', 'stable diffusion', 'ai', 'artificial', 'generated', 'dall·e', 'chatgpt']
                    if isinstance(value, str) and any(s in value.lower() for s in suspicious_software):
                        suspicious_indicators += 1

                # Check for creator/artist field
                elif tag in ['Artist', 'Creator', 'Author']:
                    if isinstance(value, str) and any(s in value.lower() for s in ['ai', 'artificial', 'generated', 'dall-e', 'midjourney']):
                        suspicious_indicators += 1

                # Check for make/model indicating AI tools
                elif tag == 'Make':
                    if isinstance(value, str) and 'ai' in value.lower():
                        suspicious_indicators += 1

    except (AttributeError, TypeError):
        # No EXIF data or error reading it
        pass

    # Check filename for AI indicators
    if filename:
        ai_filename_indicators = ['generated', 'ai', 'dall', 'midjourney', 'stable', 'diffusion', 'gemini', 'chatgpt', 'bing', 'copilot']
        if any(indicator in filename.lower() for indicator in ai_filename_indicators):
            suspicious_indicators += 1

    # Additional checks for file format patterns
    format_indicators = ['WEBP', 'AVIF']  # Formats often used by AI generators
    if image.format in format_indicators:
        suspicious_indicators += 0.5  # Partial point for format

    # Check for PNG with no EXIF (common for AI-generated images)
    if image.format == 'PNG' and not image._getexif():
        suspicious_indicators += 0.3  # Partial point for PNG without EXIF

    # Normalize score
    score = min(suspicious_indicators / total_indicators, 1.0)

    return float(score)


def visual_analysis(image: Image.Image) -> float:
    """
    Visual / Statistical Checks Component
    Performs basic visual/statistical analysis for AI detection patterns.

    Args:
        image: PIL Image object

    Returns:
        float: Visual score (0.0 to 1.0) indicating likelihood of AI
    """
    score = 0.0
    indicators = 0
    total_checks = 4

    # Convert to numpy array for analysis
    img_array = np.array(image)

    # Check 1: Noise patterns (AI images often have uniform noise)
    if len(img_array.shape) == 3:
        # Calculate noise variance across color channels
        noise_vars = []
        for channel in range(3):
            channel_data = img_array[:, :, channel].astype(np.float32)
            # Use a faster method: calculate overall variance and compare to local variance
            overall_var = np.var(channel_data)
            # Sample local variances at regular intervals to speed up
            step = max(1, min(channel_data.shape) // 50)  # Sample about 50x50 points
            local_vars = []
            for i in range(step, channel_data.shape[0]-step, step):
                for j in range(step, channel_data.shape[1]-step, step):
                    window = channel_data[i-step:i+step+1, j-step:j+step+1]
                    local_vars.append(np.var(window))
            avg_local_var = np.mean(local_vars) if local_vars else overall_var
            noise_vars.append(avg_local_var)

        avg_noise_var = np.mean(noise_vars)
        # Low noise variance might indicate AI generation
        if avg_noise_var < 50:  # Threshold, may need tuning
            indicators += 1

    # Check 2: Color histogram anomalies
    if len(img_array.shape) == 3:
        hist_scores = []
        for channel in range(3):
            hist, _ = np.histogram(img_array[:, :, channel], bins=256, range=(0, 255))
            # Check for unnatural histogram peaks (common in AI images)
            peaks = np.sum(hist > np.mean(hist) * 2)
            hist_scores.append(min(peaks / 10, 1))  # Normalize

        avg_hist_score = np.mean(hist_scores)
        if avg_hist_score > 0.7:  # High number of peaks
            indicators += 1

    # Check 3: Resolution patterns
    width, height = image.size
    aspect_ratio = max(width, height) / min(width, height)

    # AI images often have specific aspect ratios or resolutions
    common_ai_ratios = [1.0, 1.33, 1.5, 1.78, 2.0]  # 1:1, 4:3, 3:2, 16:9, 2:1
    if any(abs(aspect_ratio - r) < 0.05 for r in common_ai_ratios):
        indicators += 0.5  # Partial indicator

    # Check 4: Edge detection patterns (AI images often have crisp edges)
    if len(img_array.shape) == 3:
        gray = np.mean(img_array, axis=2).astype(np.uint8)
        # Simple edge detection using Sobel-like filter
        edges = np.abs(np.gradient(gray.astype(float)))
        edge_strength = np.mean(edges)
        if edge_strength > 100:  # Very crisp edges
            indicators += 1

    # Normalize score
    score = min(indicators / total_checks, 1.0)

    return float(score)


def ensemble_scoring(neural_score: float, metadata_score: float, visual_score: float,
                    weights: Dict[str, float] = None) -> Dict:
    """
    Ensemble / Weighted Scoring Component
    Combines all scores using configurable weights.

    Args:
        neural_score: Score from neural detection (0.0-1.0)
        metadata_score: Score from metadata analysis (0.0-1.0)
        visual_score: Score from visual analysis (0.0-1.0)
        weights: Dictionary with weights for each component (default: neural=0.6, metadata=0.3, visual=0.1)

    Returns:
        dict: Result dictionary with all scores and final classification
    """
    if weights is None:
        weights = {
            'neural': 0.6,
            'metadata': 0.3,
            'visual': 0.1
        }

    # Validate weights
    if abs(sum(weights.values()) - 1.0) > 1e-6:
        raise ValueError("Weights must sum to 1.0")

    # Calculate weighted final score
    final_score = (
        neural_score * weights['neural'] +
        metadata_score * weights['metadata'] +
        visual_score * weights['visual']
    )

    # Determine label based on threshold
    label = "AI" if final_score > 0.5 else "Real"

    result = {
        "neural_score": round(neural_score, 4),
        "metadata_score": round(metadata_score, 4),
        "visual_score": round(visual_score, 4),
        "final_score": round(final_score, 4),
        "label": label
    }

    return result


def detect_ai_artwork(image: Image.Image, filename: str = None) -> Dict:
    """
    Main detection pipeline function.
    Runs all components and returns the final result.

    Args:
        image: PIL Image object to analyze
        filename: Optional filename for metadata analysis

    Returns:
        dict: Complete detection result
    """
    # Run all detection components
    neural_score = neural_detection(image)
    metadata_score = metadata_analysis(image, filename)
    visual_score = visual_analysis(image)

    # Combine scores
    result = ensemble_scoring(neural_score, metadata_score, visual_score)

    return result


# Example usage
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python ai_detection.py <image_path> [filename]")
        sys.exit(1)

    image_path = sys.argv[1]
    filename = sys.argv[2] if len(sys.argv) > 2 else None
    try:
        img = Image.open(image_path)
        result = detect_ai_artwork(img, filename)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))