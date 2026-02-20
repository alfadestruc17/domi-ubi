<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Trip;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Emitido cuando cambia el estado de un viaje. Canal público trip.{id}.
 */
class TripStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Trip $trip
    ) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('trip.'.$this->trip->id),
        ];
    }

    /**
     * Nombre del evento para el cliente (Echo).
     */
    public function broadcastAs(): string
    {
        return 'TripStatusChanged';
    }

    /**
     * Payload público para el canal.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'trip_id' => $this->trip->id,
            'status' => $this->trip->status,
            'passenger_auth_user_id' => $this->trip->passenger_auth_user_id,
            'driver_auth_user_id' => $this->trip->driver_auth_user_id,
            'origin' => [
                'latitude' => (float) $this->trip->origin_latitude,
                'longitude' => (float) $this->trip->origin_longitude,
                'address' => $this->trip->origin_address,
            ],
            'destination' => [
                'latitude' => (float) $this->trip->destination_latitude,
                'longitude' => (float) $this->trip->destination_longitude,
                'address' => $this->trip->destination_address,
            ],
            'requested_at' => $this->trip->requested_at?->toIso8601String(),
            'accepted_at' => $this->trip->accepted_at?->toIso8601String(),
            'started_at' => $this->trip->started_at?->toIso8601String(),
            'completed_at' => $this->trip->completed_at?->toIso8601String(),
            'cancelled_at' => $this->trip->cancelled_at?->toIso8601String(),
            'updated_at' => $this->trip->updated_at->toIso8601String(),
        ];
    }
}
