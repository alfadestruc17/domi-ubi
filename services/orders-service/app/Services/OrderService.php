<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function __construct(
        private readonly CatalogServiceClient $catalogClient
    ) {}

    /**
     * Crear pedido: valida ítems con Catalog y persiste.
     */
    public function createOrder(
        int $customerAuthUserId,
        int $storeId,
        array $items,
        float $deliveryLat,
        float $deliveryLng,
        ?string $deliveryAddress = null
    ): Order {
        $validatedItems = $this->catalogClient->validateOrderItems($storeId, $items);
        if ($validatedItems === null) {
            throw new \InvalidArgumentException('Tienda o productos no válidos.');
        }

        return DB::transaction(function () use (
            $customerAuthUserId,
            $storeId,
            $validatedItems,
            $deliveryLat,
            $deliveryLng,
            $deliveryAddress
        ): Order {
            $total = 0.0;
            foreach ($validatedItems as $row) {
                $total += $row['unit_price'] * $row['quantity'];
            }

            $order = Order::query()->create([
                'auth_user_id' => $customerAuthUserId,
                'store_id' => $storeId,
                'status' => Order::STATUS_PENDING,
                'delivery_latitude' => $deliveryLat,
                'delivery_longitude' => $deliveryLng,
                'delivery_address' => $deliveryAddress,
                'total' => round($total, 2),
                'requested_at' => now(),
            ]);

            foreach ($validatedItems as $row) {
                OrderItem::query()->create([
                    'order_id' => $order->id,
                    'product_id' => $row['product_id'],
                    'product_name' => $row['product_name'],
                    'quantity' => $row['quantity'],
                    'unit_price' => $row['unit_price'],
                ]);
            }

            $order = $order->fresh(['items']);
            event(new OrderStatusChanged($order));

            return $order;
        });
    }

    public function getOrdersByCustomer(int $authUserId)
    {
        return Order::query()
            ->where('auth_user_id', $authUserId)
            ->with('items')
            ->orderByDesc('created_at')
            ->get();
    }

    public function getOrder(int $orderId, int $authUserId): ?Order
    {
        $order = Order::query()->with('items')->find($orderId);
        if (! $order || ! $order->isCustomer($authUserId)) {
            return null;
        }

        return $order;
    }
}
