<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP al Catalog Service para validar tienda y productos y obtener precios.
 */
class CatalogServiceClient
{
    public function __construct(
        private readonly string $baseUrl
    ) {}

    /**
     * Obtener tienda y sus productos. Retorna null si no existe o no está activa.
     *
     * @return array{store: array{id: int, name: string, address: string|null, latitude: float, longitude: float}, products: array<int, array{id: int, name: string, description: string|null, price: float}>}|null
     */
    public function getStoreWithProducts(int $storeId): ?array
    {
        try {
            $response = Http::acceptJson()->get(rtrim($this->baseUrl, '/').'/api/stores/'.$storeId);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();
            if (empty($data['store']) || ! isset($data['products'])) {
                return null;
            }

            return $data;
        } catch (\Throwable $e) {
            Log::warning('Catalog Service getStoreWithProducts failed', ['message' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Dado un store_id y una lista de {product_id, quantity}, valida que existan y devuelve líneas con name y price.
     *
     * @param  array<int, array{product_id: int, quantity: int}>  $items
     * @return array<int, array{product_id: int, product_name: string, quantity: int, unit_price: float}>|null  null si validación falla
     */
    public function validateOrderItems(int $storeId, array $items): ?array
    {
        $storeData = $this->getStoreWithProducts($storeId);
        if ($storeData === null) {
            return null;
        }

        $productsById = [];
        foreach ($storeData['products'] as $p) {
            $productsById[(int) $p['id']] = $p;
        }

        $result = [];
        foreach ($items as $item) {
            $productId = (int) ($item['product_id'] ?? 0);
            $quantity = (int) ($item['quantity'] ?? 0);
            if ($quantity < 1 || ! isset($productsById[$productId])) {
                return null;
            }
            $product = $productsById[$productId];
            $result[] = [
                'product_id' => $productId,
                'product_name' => $product['name'],
                'quantity' => $quantity,
                'unit_price' => (float) $product['price'],
            ];
        }

        return $result;
    }
}
