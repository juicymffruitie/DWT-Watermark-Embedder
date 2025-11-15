<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DWTVisualizerController extends Controller
{
    public function index()
    {
        return Inertia::render('DWTVisualizer');
    }

    public function visualize(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240', // max 10MB
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . $file->getClientOriginalName();
            
            // Store image temporarily
            $tempPath = $file->storeAs('temp', $filename, 'public');
            $inputPath = storage_path('app/public/' . $tempPath);
            
            // Call Python script to perform DWT decomposition
            $pythonPath = 'python'; // or 'python3' on some systems
            $scriptPath = base_path('python_scripts/visualize_dwt.py');
            
            $command = sprintf(
                '%s "%s" "%s" 2>&1',
                $pythonPath,
                $scriptPath,
                $inputPath
            );
            
            $output = shell_exec($command);
            $result = json_decode($output, true);
            
            // Clean up temporary file
            Storage::disk('public')->delete($tempPath);
            
            // Check if decomposition was successful
            if ($result && isset($result['success']) && $result['success']) {
                return Inertia::render('DWTVisualizer', [
                    'result' => $result,
                    'flash' => [
                        'success' => 'DWT decomposition completed successfully!'
                    ]
                ]);
            } else {
                $errorMsg = isset($result['message']) ? $result['message'] : 'DWT decomposition failed.';
                return back()->with('error', $errorMsg);
            }
        }

        return back()->with('error', 'No image file provided.');
    }
}
