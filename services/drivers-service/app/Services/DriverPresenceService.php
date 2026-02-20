<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Redis;

/**
 * Presencia y ubicación de conductores en Redis (lectura/escritura rápida).
 */
class DriverPresenceService
{
    private const KEY_PREFIX = 'driver:';

    private const KEY_AVAILABLE_SET = 'drivers:available';

    private const TTL_SECONDS = 3600; // 1 hora sin actualizar = considerar offline

    public function setAvailable(int $authUserId, float $latitude, float $longitude): void
    {
        $key = self::KEY_PREFIX.$authUserId;
        $payload = json_encode([
            'auth_user_id' => $authUserId,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'updated_at' => now()->toIso8601String(),
        ]);
        Redis::setex($key, self::TTL_SECONDS, $payload);
        Redis::sAdd(self::KEY_AVAILABLE_SET, (string) $authUserId);
    }

    public function setUnavailable(int $authUserId): void
    {
        Redis::del(self::KEY_PREFIX.$authUserId);
        Redis::sRem(self::KEY_AVAILABLE_SET, (string) $authUserId);
    }

    public function updateLocation(int $authUserId, float $latitude, float $longitude): void
    {
        $key = self::KEY_PREFIX.$authUserId;
        $existing = Redis::get($key);
        if ($existing === null) {
            return;
        }
        $data = json_decode($existing, true);
        $data['latitude'] = $latitude;
        $data['longitude'] = $longitude;
        $data['updated_at'] = now()->toIso8601String();
        Redis::setex($key, self::TTL_SECONDS, json_encode($data));
    }

    /**
     * @return array<int, array{auth_user_id: int, latitude: float, longitude: float, updated_at: string}>
     */
    public function getAvailableDrivers(): array
    {
        $ids = Redis::sMembers(self::KEY_AVAILABLE_SET);
        $result = [];
        foreach ($ids as $id) {
            $key = self::KEY_PREFIX.$id;
            $raw = Redis::get($key);
            if ($raw !== null) {
                $data = json_decode($raw, true);
                if (is_array($data)) {
                    $result[(int) $id] = $data;
                }
            }
        }

        return $result;
    }

    public function getDriver(int $authUserId): ?array
    {
        $raw = Redis::get(self::KEY_PREFIX.$authUserId);

        return $raw !== null ? json_decode($raw, true) : null;
    }
}
