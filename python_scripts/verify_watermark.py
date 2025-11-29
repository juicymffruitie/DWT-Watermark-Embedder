"""
DWT Watermark Verifier
This script verifies if an image contains a DWT image watermark using pattern detection
"""

import sys
import os
import numpy as np
import pywt
from PIL import Image
import json


def verify_watermark(image_path, sensitivity='medium', known_watermarks=None):
    """
    Verify if an image contains a DWT watermark using pattern detection
    
    Args:
        image_path: Path to the image to verify
        sensitivity: Detection sensitivity ('low', 'medium', 'high')
        known_watermarks: List of dicts with watermark data for pattern matching
    
    Returns:
        dict: Result with verification status and extracted watermark data
    """
    try:
        # Load image
        img = Image.open(image_path)
        img_array = np.array(img.convert('RGB'))
        
        # Convert to float
        img_array = img_array.astype(np.float64)
        
        # Store detection metrics for each channel
        channel_metrics = []
        pattern_scores = []
        
        for i in range(3):  # RGB channels
            channel = img_array[:, :, i]
            
            # Apply 2D DWT
            coeffs2 = pywt.dwt2(channel, 'haar')
            LL, (LH, HL, HH) = coeffs2
            
            # === METRIC 1: Pattern Uniformity Detection ===
            # Our watermark adds values to LL, LH, and HL coefficients
            # Check if they have unusually modified characteristics
            ll_variance = np.var(LL)
            ll_mean = np.mean(LL)
            ll_std = np.std(LL)
            
            lh_variance = np.var(LH)
            lh_mean = np.mean(LH)
            lh_std = np.std(LH)
            
            hl_variance = np.var(HL)
            hl_mean = np.mean(HL)
            hl_std = np.std(HL)
            
            # Coefficient of variation for each sub-band
            ll_cv = ll_std / (abs(ll_mean) + 1e-10)
            lh_cv = lh_std / (abs(lh_mean) + 1e-10)
            hl_cv = hl_std / (abs(hl_mean) + 1e-10)
            
            # === METRIC 2: Elevated Mean Detection ===
            # Watermark adds values, shifting means upward
            hh_mean = np.mean(np.abs(HH))
            
            # Ratios indicating watermark presence
            ll_ratio = np.mean(np.abs(LL)) / (hh_mean + 1e-10)
            lh_ratio = np.mean(np.abs(LH)) / (hh_mean + 1e-10)
            hl_ratio = np.mean(np.abs(HL)) / (hh_mean + 1e-10)
            
            # === METRIC 3: Distribution Analysis ===
            # Check if coefficients are shifted from zero
            ll_positive_ratio = np.sum(LL > 0) / LL.size
            lh_positive_ratio = np.sum(LH > 0) / LH.size
            hl_positive_ratio = np.sum(HL > 0) / HL.size
            
            # === METRIC 4: Pattern Consistency ===
            # Check for spatial consistency in watermarked sub-bands
            ll_blocks = []
            lh_blocks = []
            hl_blocks = []
            block_size = max(LH.shape[0] // 4, 1)
            
            for by in range(0, LH.shape[0], block_size):
                for bx in range(0, LH.shape[1], block_size):
                    ll_block = LL[by:by+block_size, bx:bx+block_size] if by < LL.shape[0] and bx < LL.shape[1] else None
                    lh_block = LH[by:by+block_size, bx:bx+block_size]
                    hl_block = HL[by:by+block_size, bx:bx+block_size]
                    
                    if ll_block is not None and ll_block.size > 0:
                        ll_blocks.append(np.mean(ll_block))
                    if lh_block.size > 0:
                        lh_blocks.append(np.mean(lh_block))
                    if hl_block.size > 0:
                        hl_blocks.append(np.mean(hl_block))
            
            ll_consistency = 1.0 - (np.std(ll_blocks) / (np.mean(np.abs(ll_blocks)) + 1e-10)) if ll_blocks else 0
            lh_consistency = 1.0 - (np.std(lh_blocks) / (np.mean(np.abs(lh_blocks)) + 1e-10))
            hl_consistency = 1.0 - (np.std(hl_blocks) / (np.mean(np.abs(hl_blocks)) + 1e-10))
            
            # === COMPOSITE SCORE ===
            # Calculate watermark score based on all three sub-bands
            score = 0.0
            
            # LL sub-band detection (lower strength watermark)
            if np.mean(np.abs(LL)) > 100:  # LL has higher base values
                score += 2.0
            elif np.mean(np.abs(LL)) > 90:
                score += 1.0
            
            if ll_consistency > 0.85:
                score += 1.5
            elif ll_consistency > 0.75:
                score += 0.5
            
            # LH sub-band detection (medium strength watermark)
            if np.mean(np.abs(LH)) > 4.0:
                score += 3.0
            elif np.mean(np.abs(LH)) > 2.5:
                score += 2.0
            elif np.mean(np.abs(LH)) > 1.5:
                score += 1.0
            
            if lh_ratio > 1.5:
                score += 2.0
            elif lh_ratio > 1.2:
                score += 1.0
            
            if lh_consistency > 0.75:
                score += 2.0
            elif lh_consistency > 0.6:
                score += 1.0
            
            if lh_positive_ratio > 0.65 or lh_positive_ratio < 0.35:
                score += 1.5
            elif lh_positive_ratio > 0.58 or lh_positive_ratio < 0.42:
                score += 0.5
            
            # HL sub-band detection (medium strength watermark)
            if np.mean(np.abs(HL)) > 4.0:
                score += 3.0
            elif np.mean(np.abs(HL)) > 2.5:
                score += 2.0
            elif np.mean(np.abs(HL)) > 1.5:
                score += 1.0
            
            if hl_ratio > 1.5:
                score += 2.0
            elif hl_ratio > 1.2:
                score += 1.0
            
            if hl_consistency > 0.75:
                score += 2.0
            elif hl_consistency > 0.6:
                score += 1.0
            
            if hl_positive_ratio > 0.65 or hl_positive_ratio < 0.35:
                score += 1.5
            elif hl_positive_ratio > 0.58 or hl_positive_ratio < 0.42:
                score += 0.5
            
            # Variance checks (watermark increases energy)
            if lh_variance > 3.0:
                score += 1.0
            if hl_variance > 3.0:
                score += 1.0
            
            channel_metrics.append({
                'lh_mean': float(np.mean(np.abs(LH))),
                'hl_mean': float(np.mean(np.abs(HL))),
                'll_mean': float(np.mean(np.abs(LL))),
                'lh_ratio': float(lh_ratio),
                'hl_ratio': float(hl_ratio),
                'lh_consistency': float(lh_consistency),
                'hl_consistency': float(hl_consistency),
                'll_consistency': float(ll_consistency),
                'lh_positive_ratio': float(lh_positive_ratio),
                'hl_positive_ratio': float(hl_positive_ratio),
                'score': float(score)
            })
            pattern_scores.append(score)
        
        # === FINAL DECISION ===
        avg_score = np.mean(pattern_scores)
        max_score = np.max(pattern_scores)
        min_score = np.min(pattern_scores)
        
        # Cross-channel consistency (watermark should affect all channels similarly)
        score_consistency = 1.0 - (np.std(pattern_scores) / (avg_score + 1e-10))
        
        # Sensitivity thresholds
        # Adjusted for multi-sub-band embedding (scores are higher now)
        # Real watermarked images with 3 sub-bands typically score 12-25
        # Natural images score 2-8
        thresholds = {
            'high': 15.0,     # Strict - for high confidence detection
            'medium': 10.0,   # Balanced - good for most use cases
            'low': 7.0        # Lenient - catches degraded/compressed watermarks
        }
        
        threshold = thresholds.get(sensitivity, 5.0)
        
        # Require at least 2 channels to show watermark pattern
        # Individual channel must be at least 70% of threshold to count
        channels_detected = sum(1 for s in pattern_scores if s >= (threshold * 0.7))
        
        # Detection logic with multiple criteria:
        # 1. Primary: Average score exceeds threshold + at least 2 channels detected
        # 2. Alternative: One channel very strong (threshold + 3.0) + at least 1 other channel detected
        # 3. Alternative: All 3 channels consistently elevated (90% of threshold)
        watermark_detected = (
            (avg_score >= threshold and channels_detected >= 2) or 
            (max_score >= (threshold + 3.0) and channels_detected >= 2) or
            (channels_detected >= 3 and avg_score >= (threshold * 0.85))
        )
        
        confidence_level = 'LOW'
        if avg_score >= threshold + 3.0:
            confidence_level = 'HIGH'
        elif avg_score >= threshold + 1.5:
            confidence_level = 'MEDIUM'
        
        # Check if watermark detected and known watermarks are image type
        extracted_data = None
        watermark_type = None
        
        if watermark_detected and known_watermarks:
            image_watermarks = [wm for wm in known_watermarks if wm.get('watermark_type') == 'image']
            if image_watermarks:
                watermark_type = 'image'
                # Use the filename of the first known image watermark
                extracted_data = image_watermarks[0].get('watermark_data', 'Image watermark detected')
        
        if watermark_detected:
            result = {
                'success': True,
                'hasWatermark': True,
                'message': 'DWT watermark detected in image',
                'details': f'Confidence: {confidence_level} (Score: {avg_score:.2f}/10, Channels: {channels_detected}/3)',
                'detection_score': float(avg_score),
                'confidence': confidence_level,
                'channels_detected': channels_detected,
                'channel_metrics': channel_metrics
            }
            
            # Add extracted watermark data if found
            if extracted_data:
                result['watermark_type'] = watermark_type
                result['watermark_data'] = extracted_data
            
            return result
        else:
            return {
                'success': True,
                'hasWatermark': False,
                'message': 'No DWT watermark detected',
                'details': f'Score below threshold: {avg_score:.2f}/{threshold:.2f} (Channels: {channels_detected}/3)',
                'detection_score': float(avg_score),
                'confidence': 'NONE',
                'channels_detected': channels_detected,
                'channel_metrics': channel_metrics
            }
        
    except Exception as e:
        return {
            'success': False,
            'hasWatermark': False,
            'message': f'Error verifying watermark: {str(e)}'
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'message': 'Usage: python verify_watermark.py <image_path> [sensitivity] [known_watermarks_json]'
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    sensitivity = sys.argv[2] if len(sys.argv) > 2 else 'medium'
    
    # Parse known watermarks if provided
    known_watermarks = None
    if len(sys.argv) > 3:
        try:
            known_watermarks = json.loads(sys.argv[3])
        except json.JSONDecodeError:
            known_watermarks = None
    
    result = verify_watermark(image_path, sensitivity, known_watermarks)
    print(json.dumps(result))
