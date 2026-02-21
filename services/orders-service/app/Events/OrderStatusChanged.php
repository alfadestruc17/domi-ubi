<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order
    ) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('order.'.$this->order->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'OrderStatusChanged';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'status' => $this->order->status,
            'auth_user_id' => $this->order->auth_user_id,
            'store_id' => $this->order->store_id,
            'total' => (float) $this->order->total,
            'requested_at' => $this->order->requested_at?->toIso8601String(),
            'updated_at' => $this->order->updated_at->toIso8601String(),
        ];
    }
}
