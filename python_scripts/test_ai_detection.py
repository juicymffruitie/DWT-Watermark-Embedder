#!/usr/bin/env python3
"""
Test script for AI detection pipeline
Tests the ai_detection module on images from test_images folder
"""

import os
import json
from PIL import Image
from ai_detection import detect_ai_artwork

def test_images_in_folder(folder_path, label):
    """Test all images in a folder and return results"""
    results = []
    if not os.path.exists(folder_path):
        print(f"Folder {folder_path} does not exist")
        return results

    for filename in os.listdir(folder_path):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            image_path = os.path.join(folder_path, filename)
            try:
                img = Image.open(image_path)
                result = detect_ai_artwork(img)
                result['filename'] = filename
                result['expected'] = label
                results.append(result)
                print(f"{label} - {filename}: {result}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    return results

def main():
    print("Testing AI Detection Pipeline")
    print("=" * 50)

    # Test AI-generated images
    ai_results = test_images_in_folder('test_images/AI', 'AI')

    print("\n" + "=" * 50)

    # Test Real artwork images
    art_results = test_images_in_folder('test_images/Art', 'Real')

    print("\n" + "=" * 50)
    print("Summary:")

    # Calculate statistics
    all_results = ai_results + art_results
    if all_results:
        ai_scores = [r['final_score'] for r in ai_results]
        art_scores = [r['final_score'] for r in art_results]

        print(f"AI images tested: {len(ai_results)}")
        if ai_scores:
            print(".4f")
            print(".4f")

        print(f"Real art images tested: {len(art_results)}")
        if art_scores:
            print(".4f")
            print(".4f")

        # Accuracy check (simple threshold at 0.5)
        correct_predictions = 0
        for result in all_results:
            predicted_ai = result['final_score'] > 0.5
            actual_ai = result['expected'] == 'AI'
            if predicted_ai == actual_ai:
                correct_predictions += 1

        accuracy = correct_predictions / len(all_results) * 100
        print(".1f")

if __name__ == "__main__":
    main()