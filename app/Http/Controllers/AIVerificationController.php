<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AIVerificationController extends Controller
{
    // Show the AI Verification page
    public function index(Request $request)
    {
        return Inertia::render('AIVerification');
    }

    // Process AI detection
    public function detect(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240', // 10MB max
        ]);

        // Store the uploaded image temporarily
        $path = $request->file('image')->store('temp', 'public');
        $fullPath = storage_path('app/public/' . $path);
        $originalFilename = $request->file('image')->getClientOriginalName();

        // Run Python AI detection script using virtual environment Python
        $pythonExe = base_path('.venv/Scripts/python.exe');
        $pythonPath = base_path('python_scripts/ai_detection.py');
        $command = "\"$pythonExe\" \"$pythonPath\" \"$fullPath\" \"$originalFilename\" 2>&1";
        $output = shell_exec($command);

        // Clean up temp file
        Storage::disk('public')->delete($path);

        // Parse the JSON output
        $result = json_decode($output, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json(['error' => 'Failed to process AI detection: ' . $output], 500);
        }

        return response()->json($result);
    }
}
