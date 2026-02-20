<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);

Route::middleware('auth:api')->group(function (): void {
    Route::post('validate-token', [AuthController::class, 'validateToken']);
    Route::post('logout', [AuthController::class, 'logout']);
});
