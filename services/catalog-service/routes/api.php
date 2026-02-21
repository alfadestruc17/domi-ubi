<?php

declare(strict_types=1);

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\StoreManagementController;
use Illuminate\Support\Facades\Route;

// Catálogo público (sin auth)
Route::get('stores', [StoreController::class, 'index']);
Route::get('stores/{store}', [StoreController::class, 'show']);
Route::get('products', [ProductController::class, 'index']);

// Gestión de mi tienda (auth + store_users)
Route::middleware('auth.token')->group(function (): void {
    Route::get('my-store', [StoreManagementController::class, 'myStore']);
    Route::put('stores/{store}', [StoreManagementController::class, 'updateStore']);
    Route::post('stores/{store}/products', [StoreManagementController::class, 'storeProduct']);
    Route::put('stores/{store}/products/{product}', [StoreManagementController::class, 'updateProduct']);
    Route::delete('stores/{store}/products/{product}', [StoreManagementController::class, 'destroyProduct']);
});
