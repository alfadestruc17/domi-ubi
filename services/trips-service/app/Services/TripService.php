<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\TripStatusChanged;
use App\Models\Trip;
use Illuminate\Support\Facades\DB;

/**
 * Lógica de negocio de viajes: crear, asignar conductor, transiciones de estado.
 */
class TripService
{
    public function __construct(
        private readonly DriversServiceClient $driversClient
    ) {}

    /**
     * Crear viaje (pasajero). Estado inicial: requested → searching_driver.
     */
    public function createTrip(
        int $passengerAuthUserId,
        float $originLat,
        float $originLng,
        float $destinationLat,
        float $destinationLng,
        ?string $originAddress = null,
        ?string $destinationAddress = null
    ): Trip {
        return DB::transaction(function () use (
            $passengerAuthUserId,
            $originLat,
            $originLng,
            $destinationLat,
            $destinationLng,
            $originAddress,
            $destinationAddress
        ): Trip {
            $trip = Trip::query()->create([
                'passenger_auth_user_id' => $passengerAuthUserId,
                'status' => Trip::STATUS_REQUESTED,
                'origin_latitude' => $originLat,
                'origin_longitude' => $originLng,
                'destination_latitude' => $destinationLat,
                'destination_longitude' => $destinationLng,
                'origin_address' => $originAddress,
                'destination_address' => $destinationAddress,
                'requested_at' => now(),
            ]);

            $trip->update(['status' => Trip::STATUS_SEARCHING_DRIVER]);

            $trip = $trip->fresh();
            event(new TripStatusChanged($trip));

            return $trip;
        });
    }

    /**
     * Asignar conductor al viaje (el conductor acepta).
     */
    public function assignDriver(Trip $trip, int $driverAuthUserId): Trip
    {
        if (! $trip->canBeAccepted()) {
            throw new \InvalidArgumentException('Este viaje no puede ser aceptado en su estado actual.');
        }

        $trip->update([
            'driver_auth_user_id' => $driverAuthUserId,
            'status' => Trip::STATUS_DRIVER_ASSIGNED,
            'accepted_at' => now(),
        ]);

        $trip = $trip->fresh();
        event(new TripStatusChanged($trip));

        return $trip;
    }

    /**
     * Iniciar viaje (conductor).
     */
    public function startTrip(Trip $trip): Trip
    {
        if (! $trip->canBeStarted()) {
            throw new \InvalidArgumentException('Este viaje no puede iniciarse en su estado actual.');
        }

        $trip->update([
            'status' => Trip::STATUS_IN_PROGRESS,
            'started_at' => now(),
        ]);

        $trip = $trip->fresh();
        event(new TripStatusChanged($trip));

        return $trip;
    }

    /**
     * Finalizar viaje (conductor).
     */
    public function completeTrip(Trip $trip): Trip
    {
        if (! $trip->canBeCompleted()) {
            throw new \InvalidArgumentException('Este viaje no puede completarse en su estado actual.');
        }

        $trip->update([
            'status' => Trip::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        $trip = $trip->fresh();
        event(new TripStatusChanged($trip));

        return $trip;
    }

    /**
     * Cancelar viaje (pasajero o conductor según estado).
     */
    public function cancelTrip(Trip $trip): Trip
    {
        if (! $trip->canBeCancelled()) {
            throw new \InvalidArgumentException('Este viaje no puede cancelarse en su estado actual.');
        }

        $trip->update([
            'status' => Trip::STATUS_CANCELLED,
            'cancelled_at' => now(),
        ]);

        $trip = $trip->fresh();
        event(new TripStatusChanged($trip));

        return $trip;
    }

    /**
     * Conductores disponibles (para asignar o mostrar al pasajero).
     *
     * @return array<int, array{auth_user_id: int, latitude: float, longitude: float, updated_at: string}>
     */
    public function getAvailableDrivers(): array
    {
        return $this->driversClient->getAvailableDrivers();
    }
}
