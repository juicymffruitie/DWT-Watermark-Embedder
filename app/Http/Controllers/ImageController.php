<?php

namespace App\Http\Controllers;

use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ImageController extends Controller
{
    public function index()
    {
        $images = Image::latest()->get();
        
        return Inertia::render('ImageUpload', [
            'images' => $images
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240', // max 10MB
            'watermark_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $originalFilename = time() . '_' . $file->getClientOriginalName();
            
            // Store original image temporarily
            $tempPath = $file->storeAs('temp', $originalFilename, 'public');
            $inputPath = storage_path('app/public/' . $tempPath);
            
            // Prepare watermarked filename and path
            $watermarkedFilename = 'wm_' . $originalFilename;
            $outputPath = storage_path('app/public/images/' . $watermarkedFilename);
            
            // Ensure images directory exists
            if (!file_exists(storage_path('app/public/images'))) {
                mkdir(storage_path('app/public/images'), 0755, true);
            }
            
            $watermarkImagePath = null;
            
            // Handle watermark image
            if ($request->hasFile('watermark_image')) {
                $wmFile = $request->file('watermark_image');
                $wmFilename = 'wm_temp_' . time() . '_' . $wmFile->getClientOriginalName();
                $wmTempPath = $wmFile->storeAs('temp', $wmFilename, 'public');
                $watermarkImagePath = storage_path('app/public/' . $wmTempPath);
            } else {
                return back()->with('error', 'Watermark image is required.');
            }
            
            // Call Python script to embed watermark
            $pythonPath = 'python'; // or 'python3' on some systems
            $scriptPath = base_path('python_scripts/embed_watermark.py');
            
            // Build command with watermark image path
            $command = sprintf(
                '%s "%s" "%s" "%s" "%s" 2>&1',
                $pythonPath,
                $scriptPath,
                $inputPath,
                $outputPath,
                $watermarkImagePath
            );
            
            $output = shell_exec($command);
            $result = json_decode($output, true);
            
            // Clean up temporary watermark image
            if ($watermarkImagePath && file_exists($watermarkImagePath)) {
                Storage::disk('public')->delete($wmTempPath);
            }
            
            // Check if watermark embedding was successful
            if ($result && isset($result['success']) && $result['success']) {
                // Delete temporary original file
                Storage::disk('public')->delete($tempPath);
                
                // Save watermarked image info to database
                $finalPath = 'images/' . $watermarkedFilename;
                $image = Image::create([
                    'filename' => $watermarkedFilename,
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $finalPath,
                    'mime_type' => $file->getMimeType(),
                    'size' => filesize($outputPath),
                    'watermark_type' => 'image',
                    'watermark_data' => $result['watermark_data'] ?? 'Watermark',
                    'watermark_signature' => null,
                ]);
                
                return back()->with('success', "Image uploaded and watermark embedded successfully!");
            } else {
                // If watermarking failed, store original image instead
                $path = $file->storeAs('images', $originalFilename, 'public');
                
                $image = Image::create([
                    'filename' => $originalFilename,
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ]);
                
                $errorMsg = isset($result['message']) ? $result['message'] : 'Watermarking failed, original image stored.';
                return back()->with('error', $errorMsg);
            }
        }

        return back()->with('error', 'No image file provided.');
    }

    public function destroy($id)
    {
        $image = Image::findOrFail($id);
        
        // Delete the file from storage
        Storage::disk('public')->delete($image->path);
        
        // Delete the database record
        $image->delete();

        return back()->with('success', 'Image deleted successfully!');
    }

    public function download($id)
    {
        $image = Image::findOrFail($id);
        
        // Get the full path to the file
        $filePath = storage_path('app/public/' . $image->path);
        
        // Check if file exists
        if (!file_exists($filePath)) {
            return back()->with('error', 'Image file not found.');
        }
        
        // Add "watermarked_" prefix to the filename for download
        $downloadName = 'watermarked_' . $image->original_name;
        
        // Return the file as a download with the new name
        return response()->download($filePath, $downloadName);
    }

    public function showVerify()
    {
        return Inertia::render('VerifyImage');
    }

    public function verify(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            
            // Store image temporarily for verification
            $tempFilename = 'verify_' . time() . '_' . $file->getClientOriginalName();
            $tempPath = $file->storeAs('temp', $tempFilename, 'public');
            $imagePath = storage_path('app/public/' . $tempPath);
            
            // Get all known watermarks from database for pattern matching
            $knownWatermarks = Image::whereNotNull('watermark_type')
                ->get(['watermark_type', 'watermark_data', 'watermark_signature'])
                ->toArray();
            
            $knownWatermarksJson = json_encode($knownWatermarks);
            
            // Call Python script to verify watermark with medium sensitivity
            $pythonPath = 'python'; // or 'python3' on some systems
            $scriptPath = base_path('python_scripts/verify_watermark.py');
            $sensitivity = 'medium'; // Can be 'low', 'medium', or 'high'
            
            // Escape paths for command line - now includes known watermarks
            $command = sprintf(
                '%s "%s" "%s" %s %s 2>&1',
                $pythonPath,
                $scriptPath,
                $imagePath,
                $sensitivity,
                escapeshellarg($knownWatermarksJson)
            );
            
            $output = shell_exec($command);
            $result = json_decode($output, true);
            
            // Delete temporary file
            Storage::disk('public')->delete($tempPath);
            
            // Check if verification was successful
            if ($result && isset($result['success']) && $result['success']) {
                $verificationData = [
                    'hasWatermark' => $result['hasWatermark'],
                    'message' => $result['message'],
                    'details' => isset($result['details']) ? $result['details'] : null,
                    'confidence' => isset($result['confidence']) ? $result['confidence'] : 'UNKNOWN',
                    'detection_score' => isset($result['detection_score']) ? $result['detection_score'] : 0,
                    'channels_detected' => isset($result['channels_detected']) ? $result['channels_detected'] : 0,
                ];
                
                // Add extracted watermark data if available
                if (isset($result['watermark_type'])) {
                    $verificationData['watermark_type'] = $result['watermark_type'];
                }
                if (isset($result['watermark_data'])) {
                    $verificationData['watermark_data'] = $result['watermark_data'];
                }
                
                return Inertia::render('VerifyImage', [
                    'verificationResult' => $verificationData
                ]);
            } else {
                // Error in verification
                $errorMsg = isset($result['message']) ? $result['message'] : 'Error verifying watermark.';
                return back()->with('error', $errorMsg);
            }
        }

        return back()->with('error', 'No image file provided.');
    }
}
