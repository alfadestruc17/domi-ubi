<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService
    ) {}

    /**
     * Crear pedido.
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');

        try {
            $order = $this->orderService->createOrder(
                $authUserId,
                (int) $request->validated('store_id'),
                $request->validated('items'),
                (float) $request->validated('delivery_latitude'),
                (float) $request->validated('delivery_longitude'),
                $request->validated('delivery_address')
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Pedido creado',
            'order' => $this->formatOrder($order),
        ], 201);
    }

    /**
     * Mis pedidos (cliente) o pedidos asignados a mí (repartidor: ?driver=me).
     */
    public function index(Request $request): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');

        if ($request->query('driver') === 'me') {
            $orders = $this->orderService->getOrdersByDriver($authUserId);
        } else {
            $orders = $this->orderService->getOrdersByCustomer($authUserId);
        }

        return response()->json([
            'orders' => $orders->map(fn (Order $o) => $this->formatOrder($o)),
        ]);
    }

    /**
     * Detalle: cliente (su pedido) o repartidor (pedido asignado).
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        $order = $this->orderService->getOrder($id, $authUserId)
            ?? $this->orderService->getOrderForDriver($id, $authUserId);

        if (! $order) {
            return response()->json(['error' => 'Pedido no encontrado'], 404);
        }

        return response()->json(['order' => $this->formatOrder($order)]);
    }

    /**
     * Asignar repartidor al pedido (cuando está ready_for_pickup).
     */
    public function assign(Request $request, int $id): JsonResponse
    {
        $order = Order::query()->find($id);
        if (! $order) {
            return response()->json(['error' => 'Pedido no encontrado'], 404);
        }
        try {
            $this->orderService->assignDriverToOrder($order);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Repartidor asignado',
            'order' => $this->formatOrder($order->fresh(['items'])),
        ]);
    }

    /**
     * Actualizar estado (solo repartidor asignado: picked_up, on_the_way, delivered).
     */
    public function updateStatus(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        $order = Order::query()->with('items')->find($id);
        if (! $order) {
            return response()->json(['error' => 'Pedido no encontrado'], 404);
        }
        try {
            $order = $this->orderService->updateOrderStatus(
                $order,
                $request->validated('status'),
                $authUserId
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Estado actualizado', 'order' => $this->formatOrder($order)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'store_id' => $order->store_id,
            'status' => $order->status,
            'total' => (float) $order->total,
            'delivery_latitude' => (float) $order->delivery_latitude,
            'delivery_longitude' => (float) $order->delivery_longitude,
            'delivery_address' => $order->delivery_address,
            'driver_auth_user_id' => $order->driver_auth_user_id,
            'requested_at' => $order->requested_at?->toIso8601String(),
            'assigned_at' => $order->assigned_at?->toIso8601String(),
            'delivered_at' => $order->delivered_at?->toIso8601String(),
            'items' => $order->items->map(fn ($i) => [
                'product_id' => $i->product_id,
                'product_name' => $i->product_name,
                'quantity' => $i->quantity,
                'unit_price' => (float) $i->unit_price,
            ])->all(),
        ];
    }
}
