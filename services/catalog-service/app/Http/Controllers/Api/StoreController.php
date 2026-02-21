<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;

/**
 * Catálogo público: tiendas y productos. Sin autenticación para listado.
 */
class StoreController extends Controller
{
    /**
     * Listar tiendas activas.
     */
    public function index(): JsonResponse
    {
        $stores = Store::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'address', 'latitude', 'longitude']);

        return response()->json(['stores' => $stores]);
    }

    /**
     * Detalle de tienda con sus productos activos.
     */
    public function show(Store $store): JsonResponse
    {
        if (! $store->is_active) {
            return response()->json(['error' => 'Tienda no disponible'], 404);
        }

        $store->load(['products' => fn ($q) => $q->active()->orderBy('name')]);

        return response()->json([
            'store' => $store->only(['id', 'name', 'address', 'latitude', 'longitude']),
            'products' => $store->products->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description,
                'price' => (float) $p->price,
            ]),
        ]);
    }
}
