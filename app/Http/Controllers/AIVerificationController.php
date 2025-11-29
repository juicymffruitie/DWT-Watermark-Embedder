<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AIVerificationController extends Controller
{
    // Show the AI Verification page
    public function index(Request $request)
    {
        return Inertia::render('AIVerification');
    }
}
