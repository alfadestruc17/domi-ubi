<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trip extends Model
{
    public const STATUS_REQUESTED = 'requested';

    public const STATUS_SEARCHING_DRIVER = 'searching_driver';

    public const STATUS_DRIVER_ASSIGNED = 'driver_assigned';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const VALID_STATUSES = [
        self::STATUS_REQUESTED,
        self::STATUS_SEARCHING_DRIVER,
        self::STATUS_DRIVER_ASSIGNED,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
        'passenger_auth_user_id',
        'driver_auth_user_id',
        'status',
        'origin_latitude',
        'origin_longitude',
        'destination_latitude',
        'destination_longitude',
        'origin_address',
        'destination_address',
        'requested_at',
        'accepted_at',
        'started_at',
        'completed_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'accepted_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'origin_latitude' => 'decimal:8',
            'origin_longitude' => 'decimal:8',
            'destination_latitude' => 'decimal:8',
            'destination_longitude' => 'decimal:8',
        ];
    }

    public function isPassenger(int $authUserId): bool
    {
        return (int) $this->passenger_auth_user_id === $authUserId;
    }

    public function isDriver(int $authUserId): bool
    {
        return $this->driver_auth_user_id !== null && (int) $this->driver_auth_user_id === $authUserId;
    }

    public function canBeAccepted(): bool
    {
        return $this->status === self::STATUS_SEARCHING_DRIVER || $this->status === self::STATUS_REQUESTED;
    }

    public function canBeStarted(): bool
    {
        return $this->status === self::STATUS_DRIVER_ASSIGNED;
    }

    public function canBeCompleted(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [
            self::STATUS_REQUESTED,
            self::STATUS_SEARCHING_DRIVER,
            self::STATUS_DRIVER_ASSIGNED,
        ], true);
    }
}
