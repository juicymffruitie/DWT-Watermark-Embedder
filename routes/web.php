<?php

use App\Http\Controllers\ImageController;
use App\Http\Controllers\DWTVisualizerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Main application routes
Route::get('/', [ImageController::class, 'index'])->name('home');
Route::post('/images', [ImageController::class, 'store'])->name('images.store');
Route::get('/images/{id}/download', [ImageController::class, 'download'])->name('images.download');
Route::delete('/images/{id}', [ImageController::class, 'destroy'])->name('images.destroy');

// Verification routes
Route::get('/verify', [ImageController::class, 'showVerify'])->name('verify');
Route::post('/verify', [ImageController::class, 'verify'])->name('verify.check');

// DWT Visualizer routes
Route::get('/visualize', [DWTVisualizerController::class, 'index'])->name('visualize');
Route::post('/visualize', [DWTVisualizerController::class, 'visualize'])->name('visualize.process');
