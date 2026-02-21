<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Gestión de tienda y productos (usuario con rol store, dueño de la tienda).
 */
class StoreManagementController extends Controller
{
    private function getStoreIdForUser(int $authUserId): ?int
    {
        $su = StoreUser::query()->where('auth_user_id', $authUserId)->first();

        return $su?->store_id;
    }

    private function authorizeStore(int $authUserId, Store $store): bool
    {
        return $this->getStoreIdForUser($authUserId) === (int) $store->id;
    }

    /**
     * Mi tienda (la asociada a mi usuario).
     */
    public function myStore(Request $request): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        $storeId = $this->getStoreIdForUser($authUserId);
        if ($storeId === null) {
            return response()->json(['error' => 'No tienes una tienda asignada'], 404);
        }

        $store = Store::query()->with(['products' => fn ($q) => $q->orderBy('name')])->find($storeId);
        if (! $store) {
            return response()->json(['error' => 'Tienda no encontrada'], 404);
        }

        return response()->json([
            'store' => $store->only(['id', 'name', 'address', 'latitude', 'longitude', 'is_active']),
            'products' => $store->products->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description,
                'price' => (float) $p->price,
                'is_active' => $p->is_active,
            ]),
        ]);
    }

    /**
     * Actualizar datos de mi tienda.
     */
    public function updateStore(Request $request, Store $store): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        if (! $this->authorizeStore($authUserId, $store)) {
            return response()->json(['error' => 'No tienes permiso sobre esta tienda'], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $store->update($validated);

        return response()->json([
            'message' => 'Tienda actualizada',
            'store' => $store->fresh()->only(['id', 'name', 'address', 'latitude', 'longitude', 'is_active']),
        ]);
    }

    /**
     * Crear producto en mi tienda.
     */
    public function storeProduct(Request $request, Store $store): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        if (! $this->authorizeStore($authUserId, $store)) {
            return response()->json(['error' => 'No tienes permiso sobre esta tienda'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
        ]);

        $product = $store->products()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
        ]);

        return response()->json([
            'message' => 'Producto creado',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => (float) $product->price,
            ],
        ], 201);
    }

    /**
     * Actualizar producto de mi tienda.
     */
    public function updateProduct(Request $request, Store $store, Product $product): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        if (! $this->authorizeStore($authUserId, $store)) {
            return response()->json(['error' => 'No tienes permiso sobre esta tienda'], 403);
        }
        if ((int) $product->store_id !== (int) $store->id) {
            return response()->json(['error' => 'Producto no pertenece a esta tienda'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Producto actualizado',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => (float) $product->price,
                'is_active' => $product->is_active,
            ],
        ]);
    }

    /**
     * Eliminar producto de mi tienda (soft: is_active = false o borrado real).
     */
    public function destroyProduct(Request $request, Store $store, Product $product): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        if (! $this->authorizeStore($authUserId, $store)) {
            return response()->json(['error' => 'No tienes permiso sobre esta tienda'], 403);
        }
        if ((int) $product->store_id !== (int) $store->id) {
            return response()->json(['error' => 'Producto no pertenece a esta tienda'], 404);
        }

        $product->delete();

        return response()->json(['message' => 'Producto eliminado']);
    }
}
