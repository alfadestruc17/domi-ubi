<?php

declare(strict_types=1);

use App\Http\Controllers\Api\DriverController;
use Illuminate\Support\Facades\Route;

Route::get('drivers/available', [DriverController::class, 'available']);

Route::middleware('auth.token')->group(function (): void {
    Route::get('drivers/me', [DriverController::class, 'me']);
    Route::put('drivers/me/availability', [DriverController::class, 'updateAvailability']);
    Route::put('drivers/me/location', [DriverController::class, 'updateLocation']);
});
