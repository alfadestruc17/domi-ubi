<?php

declare(strict_types=1);

use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.token')->group(function (): void {
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders', [OrderController::class, 'index']);
    Route::get('orders/{id}', [OrderController::class, 'show']);
    Route::post('orders/{id}/assign', [OrderController::class, 'assign']);
    Route::patch('orders/{id}/status', [OrderController::class, 'updateStatus']);
});
