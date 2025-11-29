<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AIVerificationController extends Controller
{
    // Show the AI Verification page
    public function index(Request $request)
    {
        $aiResult = $request->session()->get('aiResult');
        $request->session()->forget('aiResult'); // Clear after retrieving

        return Inertia::render('AIVerification', [
            'aiResult' => $aiResult
        ]);
    }

    // Handle AI verification POST
    public function verify(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:10240', // 10MB max
        ]);

        try {
            // Get uploaded file
            $uploadedFile = $request->file('image');

            // Create temporary file path
            $tempPath = sys_get_temp_dir() . '/' . uniqid('ai_verify_') . '.' . $uploadedFile->getClientOriginalExtension();

            // Move uploaded file to temp location
            $uploadedFile->move(dirname($tempPath), basename($tempPath));

            // Path to Python script
            $pythonScript = base_path('python_scripts/ai_detection.py');

            // Build command to run Python script
            $command = escapeshellcmd("python \"{$pythonScript}\" \"{$tempPath}\"");

            // Execute Python script
            $output = shell_exec($command);

            // Clean up temp file
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

            // Parse JSON output
            $result = json_decode($output, true);

            if (!$result || !isset($result['success'])) {
                throw new \Exception('Failed to parse AI detection result');
            }

            if (!$result['success']) {
                return back()->withErrors(['image' => $result['error'] ?? 'AI detection failed']);
            }

            // Return Inertia response with result
            return back()->with('aiResult', $result);

        } catch (\Exception $e) {
            return back()->withErrors(['image' => 'Error processing image: ' . $e->getMessage()]);
        }
    }
}
