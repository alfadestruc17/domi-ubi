<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\DriverAvailabilityChanged;
use App\Events\DriverLocationUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDriverLocationRequest;
use App\Models\Driver;
use App\Services\DriverPresenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Estado del conductor: disponibilidad (online/offline) y ubicación.
 */
class DriverController extends Controller
{
    public function __construct(
        private readonly DriverPresenceService $presence
    ) {}

    /**
     * Mi estado como conductor (requiere JWT).
     */
    public function me(Request $request): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');

        $driver = Driver::query()->where('auth_user_id', $authUserId)->first();
        $redisData = $this->presence->getDriver($authUserId);

        if (! $driver) {
            return response()->json([
                'message' => 'Registro de conductor no encontrado. Actualiza disponibilidad para crearlo.',
                'driver' => null,
            ]);
        }

        $payload = [
            'driver' => [
                'id' => $driver->id,
                'auth_user_id' => $driver->auth_user_id,
                'is_available' => $driver->is_available,
                'latitude' => $driver->latitude ? (float) $driver->latitude : null,
                'longitude' => $driver->longitude ? (float) $driver->longitude : null,
                'last_location_at' => $driver->last_location_at?->toIso8601String(),
            ],
        ];
        if ($redisData !== null) {
            $payload['presence'] = $redisData;
        }

        return response()->json($payload);
    }

    /**
     * Poner conductor online (con ubicación inicial) o offline.
     */
    public function updateAvailability(Request $request): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        $available = (bool) $request->input('available', true);
        $latitude = $request->has('latitude') ? (float) $request->input('latitude') : null;
        $longitude = $request->has('longitude') ? (float) $request->input('longitude') : null;

        $driver = Driver::query()->firstOrCreate(
            ['auth_user_id' => $authUserId],
            ['is_available' => false, 'latitude' => null, 'longitude' => null]
        );

        if ($available) {
            $lat = $latitude ?? (float) ($driver->latitude ?? 0);
            $lng = $longitude ?? (float) ($driver->longitude ?? 0);
            $driver->update([
                'is_available' => true,
                'latitude' => $lat,
                'longitude' => $lng,
                'last_location_at' => now(),
            ]);
            $this->presence->setAvailable($driver->auth_user_id, $lat, $lng);
            event(new DriverAvailabilityChanged($authUserId, true, $lat, $lng));
        } else {
            $driver->setOffline();
            $this->presence->setUnavailable($authUserId);
            event(new DriverAvailabilityChanged($authUserId, false));
        }

        return response()->json([
            'message' => $available ? 'Conductor en línea' : 'Conductor fuera de línea',
            'driver' => [
                'id' => $driver->id,
                'auth_user_id' => $driver->auth_user_id,
                'is_available' => $driver->is_available,
                'latitude' => $driver->latitude ? (float) $driver->latitude : null,
                'longitude' => $driver->longitude ? (float) $driver->longitude : null,
            ],
        ]);
    }

    /**
     * Actualizar ubicación actual (conductor debe estar online).
     */
    public function updateLocation(UpdateDriverLocationRequest $request): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        $latitude = (float) $request->validated('latitude');
        $longitude = (float) $request->validated('longitude');

        $driver = Driver::query()->where('auth_user_id', $authUserId)->first();

        if (! $driver) {
            return response()->json(['error' => 'Registro de conductor no encontrado'], 404);
        }

        $driver->updateLocation($latitude, $longitude);
        $this->presence->updateLocation($authUserId, $latitude, $longitude);

        event(new DriverLocationUpdated(
            $authUserId,
            $latitude,
            $longitude,
            now()->toIso8601String()
        ));

        return response()->json([
            'message' => 'Ubicación actualizada',
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);
    }

    /**
     * Listar conductores disponibles (para Trips Service o frontend). Sin auth para llamadas internas;
     * en producción proteger con API key o red interna.
     */
    public function available(Request $request): JsonResponse
    {
        $drivers = $this->presence->getAvailableDrivers();
        $list = array_values($drivers);

        return response()->json([
            'count' => count($list),
            'drivers' => $list,
        ]);
    }
}
