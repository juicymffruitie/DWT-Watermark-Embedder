"""
DWT Visualizer
This script decomposes an image using DWT and returns the 4 sub-levels as base64 images
"""

import sys
import os
import numpy as np
import pywt
from PIL import Image
import json
import base64
import io


def normalize_for_display(coeffs):
    """
    Normalize DWT coefficients for display as images
    Maps values to 0-255 range
    """
    # Normalize to 0-255 range
    coeffs_min = np.min(coeffs)
    coeffs_max = np.max(coeffs)
    
    if coeffs_max - coeffs_min > 0:
        normalized = ((coeffs - coeffs_min) / (coeffs_max - coeffs_min)) * 255
    else:
        normalized = np.zeros_like(coeffs)
    
    return normalized.astype(np.uint8)


def array_to_base64(array):
    """
    Convert numpy array to base64 encoded PNG
    """
    img = Image.fromarray(array)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    return img_base64


def visualize_dwt(image_path):
    """
    Perform DWT decomposition and return all 4 sub-levels as base64 images
    
    Args:
        image_path: Path to the input image
    
    Returns:
        dict: Result with base64 encoded images for each sub-level
    """
    try:
        # Load image
        img = Image.open(image_path)
        
        # Convert to grayscale for clearer visualization
        img_gray = img.convert('L')
        img_array = np.array(img_gray, dtype=np.float64)
        
        # Apply 2D DWT
        coeffs2 = pywt.dwt2(img_array, 'haar')
        LL, (LH, HL, HH) = coeffs2
        
        # Normalize each sub-level for visualization
        ll_normalized = normalize_for_display(LL)
        lh_normalized = normalize_for_display(LH)
        hl_normalized = normalize_for_display(HL)
        hh_normalized = normalize_for_display(HH)
        
        # Convert to base64
        ll_base64 = array_to_base64(ll_normalized)
        lh_base64 = array_to_base64(lh_normalized)
        hl_base64 = array_to_base64(hl_normalized)
        hh_base64 = array_to_base64(hh_normalized)
        
        return {
            'success': True,
            'message': 'DWT decomposition successful',
            'll_base64': ll_base64,
            'lh_base64': lh_base64,
            'hl_base64': hl_base64,
            'hh_base64': hh_base64,
            'shapes': {
                'll': list(LL.shape),
                'lh': list(LH.shape),
                'hl': list(HL.shape),
                'hh': list(HH.shape),
            }
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'Error performing DWT decomposition: {str(e)}'
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'message': 'Usage: python visualize_dwt.py <image_path>'
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    result = visualize_dwt(image_path)
    print(json.dumps(result))
