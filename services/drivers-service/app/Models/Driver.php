<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    protected $fillable = [
        'auth_user_id',
        'is_available',
        'latitude',
        'longitude',
        'last_location_at',
    ];

    protected function casts(): array
    {
        return [
            'is_available' => 'boolean',
            'last_location_at' => 'datetime',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
        ];
    }

    public function setOnline(): void
    {
        $this->update(['is_available' => true]);
    }

    public function setOffline(): void
    {
        $this->update(['is_available' => false]);
    }

    public function updateLocation(float $latitude, float $longitude): void
    {
        $this->update([
            'latitude' => $latitude,
            'longitude' => $longitude,
            'last_location_at' => now(),
        ]);
    }
}
