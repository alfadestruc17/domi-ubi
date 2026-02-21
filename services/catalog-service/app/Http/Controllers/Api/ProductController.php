<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Productos del catálogo. Listado filtrado por tienda.
 */
class ProductController extends Controller
{
    /**
     * Listar productos. Query: store_id (opcional), search (opcional).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->active()->with('store:id,name');

        if ($request->filled('store_id')) {
            $query->where('store_id', (int) $request->input('store_id'));
        }

        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term): void {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%");
            });
        }

        $products = $query->orderBy('name')->get(['id', 'store_id', 'name', 'description', 'price']);

        return response()->json([
            'products' => $products->map(fn ($p) => [
                'id' => $p->id,
                'store_id' => $p->store_id,
                'store_name' => $p->store?->name,
                'name' => $p->name,
                'description' => $p->description,
                'price' => (float) $p->price,
            ]),
        ]);
    }
}
