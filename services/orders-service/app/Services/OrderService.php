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
        private readonly CatalogServiceClient $catalogClient,
        private readonly DriversServiceClient $driversClient
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

    public function getOrdersByDriver(int $driverAuthUserId): \Illuminate\Database\Eloquent\Collection
    {
        return Order::query()
            ->where('driver_auth_user_id', $driverAuthUserId)
            ->with('items')
            ->orderByDesc('created_at')
            ->get();
    }

    public function getOrderForDriver(int $orderId, int $driverAuthUserId): ?Order
    {
        $order = Order::query()->with('items')->find($orderId);
        if (! $order || ! $order->isDriver($driverAuthUserId)) {
            return null;
        }

        return $order;
    }

    /**
     * Asignar un repartidor disponible al pedido (cuando está ready_for_pickup).
     */
    public function assignDriverToOrder(Order $order): void
    {
        if ($order->status !== Order::STATUS_READY_FOR_PICKUP) {
            throw new \InvalidArgumentException('Solo se puede asignar repartidor cuando el pedido está listo para recoger.');
        }
        if ($order->driver_auth_user_id !== null) {
            return;
        }

        $drivers = $this->driversClient->getAvailableDrivers();
        if (empty($drivers)) {
            throw new \InvalidArgumentException('No hay repartidores disponibles.');
        }

        $first = $drivers[0];
        $driverAuthUserId = (int) ($first['auth_user_id'] ?? 0);
        if ($driverAuthUserId < 1) {
            throw new \InvalidArgumentException('Datos de repartidor no válidos.');
        }

        $order->update([
            'driver_auth_user_id' => $driverAuthUserId,
            'status' => Order::STATUS_ASSIGNED,
            'assigned_at' => now(),
        ]);

        $order->refresh();
        event(new OrderStatusChanged($order));
    }

    /**
     * Actualizar estado del pedido. Valida transición y que el usuario sea conductor o tienda.
     */
    public function updateOrderStatus(Order $order, string $newStatus, int $authUserId): Order
    {
        if ($order->isDriver($authUserId)) {
            if (! $order->driverCanTransitionTo($newStatus)) {
                throw new \InvalidArgumentException('Transición no permitida.');
            }
        } elseif ($order->storeCanTransitionTo($newStatus)) {
            // Tienda: D5 restringirá a dueño de la tienda vía Catalog
        } else {
            throw new \InvalidArgumentException('No tienes permiso para cambiar el estado.');
        }

        $updates = ['status' => $newStatus];
        if ($newStatus === Order::STATUS_READY_FOR_PICKUP) {
            $updates['ready_for_pickup_at'] = now();
        }
        if ($newStatus === Order::STATUS_PICKED_UP) {
            $updates['picked_up_at'] = now();
        }
        if ($newStatus === Order::STATUS_DELIVERED) {
            $updates['delivered_at'] = now();
        }

        $order->update($updates);
        $order = $order->fresh(['items']);
        event(new OrderStatusChanged($order));

        return $order;
    }
}
