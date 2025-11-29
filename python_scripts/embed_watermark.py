"""
DWT Watermark Embedder
This script embeds an image watermark into an image using Discrete Wavelet Transform (DWT)
"""

import sys
import os
import numpy as np
import pywt
from PIL import Image
import json


def image_to_pattern(watermark_image_path, target_shape):
    """
    Convert watermark image to a pattern for embedding
    
    Args:
        watermark_image_path: Path to watermark image
        target_shape: Target shape for the pattern
    
    Returns:
        numpy array: Pattern generated from image
 I   """
    # Load watermark image
    wm_img = Image.open(watermark_image_path).convert('L')  # Convert to grayscale
    
    # Resize to match target shape
    wm_img = wm_img.resize((target_shape[1], target_shape[0]), Image.LANCZOS)
    
    # Convert to numpy array and normalize to [-1, 1]
    wm_array = np.array(wm_img, dtype=np.float64)
    wm_array = (wm_array / 255.0) * 2 - 1
    
    return wm_array


def embed_watermark(image_path, output_path, watermark_image_path):
    """
    Embed an image watermark into an image using DWT
    
    Args:
        image_path: Path to the input image
        output_path: Path to save the watermarked image
        watermark_image_path: Path to the watermark image
    
    Returns:
        dict: Result with success status and message
    """
    try:
        # Validate watermark image path
        if not watermark_image_path or not os.path.exists(watermark_image_path):
            return {
                'success': False,
                'message': 'Watermark image path is required and must exist'
            }
        
        # Load image
        img = Image.open(image_path)
        img_array = np.array(img.convert('RGB'))
        
        # Convert to float
        img_array = img_array.astype(np.float64)
        
        # Process each color channel
        watermarked = np.zeros_like(img_array)
        
        for i in range(3):  # RGB channels
            channel = img_array[:, :, i]
            
            # Apply 2D DWT
            coeffs2 = pywt.dwt2(channel, 'haar')
            LL, (LH, HL, HH) = coeffs2
            
            # Generate watermark patterns for each sub-band
            # Using different strengths optimized for each sub-band
            ll_pattern = image_to_pattern(watermark_image_path, LL.shape)
            lh_pattern = image_to_pattern(watermark_image_path, LH.shape)
            hl_pattern = image_to_pattern(watermark_image_path, HL.shape)
            
            # Embed watermark in multiple sub-bands for robustness
            # LL: Lower strength (1.5) - most visible but most robust
            # LH: Medium strength (6.0) - horizontal details
            # HL: Medium strength (6.0) - vertical details
            # HH: Not used - too fragile to compression
            ll_strength = 1.5
            lh_strength = 6.0
            hl_strength = 6.0
            
            LL_watermarked = LL + (ll_pattern * ll_strength)
            LH_watermarked = LH + (lh_pattern * lh_strength)
            HL_watermarked = HL + (hl_pattern * hl_strength)
            
            # Reconstruct image with watermarked sub-bands
            coeffs2_watermarked = LL_watermarked, (LH_watermarked, HL_watermarked, HH)
            reconstructed = pywt.idwt2(coeffs2_watermarked, 'haar')
            
            # Handle dimension mismatch due to DWT
            if reconstructed.shape != channel.shape:
                # Crop or pad to match original dimensions
                min_h = min(reconstructed.shape[0], channel.shape[0])   
                min_w = min(reconstructed.shape[1], channel.shape[1])
                watermarked[:min_h, :min_w, i] = reconstructed[:min_h, :min_w]
            else:
                watermarked[:, :, i] = reconstructed
        
        # Convert back to uint8
        watermarked = np.clip(watermarked, 0, 255).astype(np.uint8)
        
        # Save watermarked image
        result_img = Image.fromarray(watermarked)
        result_img.save(output_path, quality=95)
        
        return {
            'success': True,
            'message': 'Image watermark embedded successfully',
            'output_path': output_path,
            'watermark_type': 'image',
            'watermark_data': os.path.basename(watermark_image_path),
            'watermark_signature': None
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'Error embedding watermark: {str(e)}'
        }


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({
            'success': False,
            'message': 'Usage: python embed_watermark.py <input_image> <output_image> <watermark_image>'
        }))
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    watermark_image = sys.argv[3]
    
    result = embed_watermark(input_path, output_path, watermark_image)
    print(json.dumps(result))
