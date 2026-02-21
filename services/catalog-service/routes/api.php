<?php

declare(strict_types=1);

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StoreController;
use Illuminate\Support\Facades\Route;

// Catálogo público (sin auth)
Route::get('stores', [StoreController::class, 'index']);
Route::get('stores/{store}', [StoreController::class, 'show']);
Route::get('products', [ProductController::class, 'index']);
