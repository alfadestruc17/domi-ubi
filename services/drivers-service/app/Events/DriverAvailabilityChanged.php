<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Emitido cuando un conductor pasa a online u offline. Canal público "drivers".
 */
class DriverAvailabilityChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $authUserId,
        public bool $available,
        public ?float $latitude = null,
        public ?float $longitude = null,
        public string $updatedAt = ''
    ) {
        $this->updatedAt = $updatedAt ?: now()->toIso8601String();
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('drivers'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'DriverAvailabilityChanged';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'auth_user_id' => $this->authUserId,
            'available' => $this->available,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'updated_at' => $this->updatedAt,
        ];
    }
}
