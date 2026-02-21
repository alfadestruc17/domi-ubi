<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_PREPARING = 'preparing';

    public const STATUS_READY_FOR_PICKUP = 'ready_for_pickup';

    public const STATUS_ASSIGNED = 'assigned';

    public const STATUS_PICKED_UP = 'picked_up';

    public const STATUS_ON_THE_WAY = 'on_the_way';

    public const STATUS_DELIVERED = 'delivered';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'auth_user_id',
        'store_id',
        'status',
        'delivery_latitude',
        'delivery_longitude',
        'delivery_address',
        'driver_auth_user_id',
        'total',
        'requested_at',
        'confirmed_at',
        'ready_for_pickup_at',
        'assigned_at',
        'picked_up_at',
        'delivered_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'delivery_latitude' => 'decimal:8',
            'delivery_longitude' => 'decimal:8',
            'requested_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'ready_for_pickup_at' => 'datetime',
            'assigned_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function isCustomer(int $authUserId): bool
    {
        return (int) $this->auth_user_id === $authUserId;
    }

    public function isDriver(int $authUserId): bool
    {
        return $this->driver_auth_user_id !== null && (int) $this->driver_auth_user_id === $authUserId;
    }

    /** Transiciones permitidas para el repartidor. */
    public function driverCanTransitionTo(string $status): bool
    {
        $allowed = [
            self::STATUS_ASSIGNED => [self::STATUS_PICKED_UP],
            self::STATUS_PICKED_UP => [self::STATUS_ON_THE_WAY],
            self::STATUS_ON_THE_WAY => [self::STATUS_DELIVERED],
        ];

        return isset($allowed[$this->status]) && in_array($status, $allowed[$this->status], true);
    }

    /** Transiciones permitidas para la tienda (pending → preparing → ready_for_pickup). */
    public function storeCanTransitionTo(string $status): bool
    {
        $allowed = [
            self::STATUS_PENDING => [self::STATUS_CONFIRMED, self::STATUS_PREPARING],
            self::STATUS_CONFIRMED => [self::STATUS_PREPARING],
            self::STATUS_PREPARING => [self::STATUS_READY_FOR_PICKUP],
        ];

        return isset($allowed[$this->status]) && in_array($status, $allowed[$this->status], true);
    }
}
