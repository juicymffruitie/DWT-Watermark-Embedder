# DWT Watermark Python Scripts

This directory contains Python scripts for DWT watermark embedding and verification.

## Requirements

Install the required Python packages:

```bash
pip install numpy pillow PyWavelets
```

## Scripts

### embed_watermark.py

Embeds a DWT watermark into an image.

**Usage:**

```bash
python embed_watermark.py <input_image> <output_image> [watermark_text]
```

### verify_watermark.py

Verifies if an image contains a DWT watermark.

**Usage:**

```bash
python verify_watermark.py <image_path> [threshold]
```

## How it works

The scripts use Discrete Wavelet Transform (DWT) to:

1. Decompose the image into frequency components
2. Embed watermark data in the LH (horizontal detail) coefficients
3. Reconstruct the image with the embedded watermark

The verification process:

1. Applies DWT to the image
2. Analyzes the LH coefficients for watermark patterns
3. Returns detection result based on threshold comparison
