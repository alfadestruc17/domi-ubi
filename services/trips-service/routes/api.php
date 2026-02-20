<?php

declare(strict_types=1);

use App\Http\Controllers\Api\TripController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.token')->group(function (): void {
    Route::post('trips', [TripController::class, 'store']);
    Route::get('trips', [TripController::class, 'index']);
    Route::get('trips/available-drivers', [TripController::class, 'availableDrivers']);
    Route::get('trips/{trip}', [TripController::class, 'show']);
    Route::put('trips/{trip}/status', [TripController::class, 'updateStatus']);
});
