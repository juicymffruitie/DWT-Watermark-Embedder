# DWT Watermark App - Usage Guide

## ✅ Setup Complete!

Your DWT Watermark application is now fully integrated and ready to use!

## How It Works

### 1. Upload & Watermark Images

**Page:** Upload Image (`http://localhost:8000/`)

1. Click on the upload area or drag & drop your image
2. Select an image (PNG, JPG, GIF, WEBP)
3. Click "Upload Image"
4. **Backend Process:**
    - Image is temporarily stored
    - Python script `embed_watermark.py` is called
    - DWT watermark is embedded into the image
    - Watermarked image is saved with prefix `wm_`
    - Original temp file is deleted
5. Success! Your watermarked image appears in the gallery

### 2. Verify Watermark

**Page:** Verify Image (`http://localhost:8000/verify`)

1. Click on the upload area
2. Select an image to verify
3. Click "Verify Watermark"
4. **Backend Process:**
    - Image is temporarily stored
    - Python script `verify_watermark.py` is called
    - DWT analysis is performed
    - Detection result is returned
    - Temp file is deleted
5. View the result:
    - ✅ **Green** = Watermark detected
    - ⚠️ **Yellow** = No watermark found

## Testing Workflow

### Test 1: Upload a Fresh Image

1. Go to **Upload Image** page
2. Upload any image from your computer
3. Wait for success message: "Image uploaded and watermarked successfully!"
4. You'll see your image in the gallery with filename starting with `wm_`

### Test 2: Verify the Watermarked Image

1. Go to **Verify Image** page
2. Upload the watermarked image you just created
    - You can download it from the gallery first
    - Or use the stored file from `storage/app/public/images/`
3. Click "Verify Watermark"
4. **Expected Result:** Green box showing "Watermark Detected"

### Test 3: Verify an Original (Non-Watermarked) Image

1. Stay on **Verify Image** page
2. Upload any original image (not processed by the app)
3. Click "Verify Watermark"
4. **Expected Result:** Yellow box showing "No Watermark Found"

## Technical Details

### DWT Watermarking Process

-   Uses **Haar wavelet transform** for decomposition
-   Embeds watermark in **LH (horizontal detail) coefficients**
-   Watermark strength: `0.1` (configurable in `embed_watermark.py`)
-   Detection threshold: `1.5` (configurable in `verify_watermark.py`)

### Detection Confidence

-   **Above 1.5** = Watermark detected
-   **Below 1.5** = No watermark
-   The higher the value, the stronger the watermark signal

### File Locations

-   **Uploaded/Watermarked Images:** `storage/app/public/images/`
-   **Python Scripts:** `python_scripts/`
-   **Temporary Files:** `storage/app/public/temp/` (auto-deleted)

## Troubleshooting

### Issue: "Watermarking failed"

**Solution:** Check that Python is in PATH and dependencies are installed:

```powershell
python --version
python -m pip list | Select-String "numpy|Pillow|PyWavelets"
```

### Issue: Images not showing in gallery

**Solution:** Ensure storage link exists:

```powershell
php artisan storage:link
```

### Issue: Verification always shows "No watermark"

**Solution:**

1. Make sure you're testing images uploaded through the app
2. Check detection threshold in `python_scripts/verify_watermark.py`
3. Lower threshold if needed (currently 1.5)

## Current Status

✅ Python dependencies installed (numpy, Pillow, PyWavelets)  
✅ Storage directories created  
✅ Python scripts tested and working  
✅ Laravel controller integrated with Python  
✅ Frontend UI complete  
✅ Navigation working

**You're ready to upload and verify images!** 🎉

## Next Steps (Optional Improvements)

1. **Add watermark strength control** - Let users adjust embedding strength
2. **Show before/after comparison** - Display original vs watermarked side-by-side
3. **Batch processing** - Upload and watermark multiple images at once
4. **Custom watermark text** - Allow users to specify watermark content
5. **Export watermarked images** - Add bulk download feature
6. **Watermark statistics** - Show detection confidence graphs

## Support

If you encounter any issues:

1. Check the Laravel logs: `storage/logs/laravel.log`
2. Check Python script output in browser Network tab
3. Test Python scripts directly: `python python_scripts/test_dwt.py`
