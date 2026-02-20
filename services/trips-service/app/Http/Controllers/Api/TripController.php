<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripStatusRequest;
use App\Models\Trip;
use App\Services\TripService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripController extends Controller
{
    public function __construct(
        private readonly TripService $tripService
    ) {}

    /**
     * Crear viaje (pasajero). Requiere JWT.
     */
    public function store(StoreTripRequest $request): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');

        $trip = $this->tripService->createTrip(
            $authUserId,
            (float) $request->validated('origin_latitude'),
            (float) $request->validated('origin_longitude'),
            (float) $request->validated('destination_latitude'),
            (float) $request->validated('destination_longitude'),
            $request->validated('origin_address'),
            $request->validated('destination_address')
        );

        return response()->json([
            'message' => 'Viaje solicitado. Buscando conductor...',
            'trip' => $this->tripToArray($trip),
        ], 201);
    }

    /**
     * Listar mis viajes (como pasajero o como conductor).
     */
    public function index(Request $request): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');

        $trips = Trip::query()
            ->where('passenger_auth_user_id', $authUserId)
            ->orWhere('driver_auth_user_id', $authUserId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'trips' => $trips->map(fn (Trip $t) => $this->tripToArray($t)),
        ]);
    }

    /**
     * Ver un viaje (solo si eres pasajero o conductor).
     */
    public function show(Request $request, Trip $trip): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');

        if (! $trip->isPassenger($authUserId) && ! $trip->isDriver($authUserId)) {
            return response()->json(['error' => 'No autorizado para ver este viaje'], 403);
        }

        return response()->json(['trip' => $this->tripToArray($trip)]);
    }

    /**
     * Actualizar estado: accept (conductor acepta), start, complete, cancel.
     */
    public function updateStatus(UpdateTripStatusRequest $request, Trip $trip): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        $action = $request->validated('action');

        if (in_array($action, ['start', 'complete'], true) && ! $trip->isDriver($authUserId)) {
            return response()->json(['error' => 'Solo el conductor puede iniciar o completar el viaje'], 403);
        }
        if ($action === 'cancel' && ! $trip->isPassenger($authUserId) && ! $trip->isDriver($authUserId)) {
            return response()->json(['error' => 'Solo pasajero o conductor pueden cancelar'], 403);
        }

        try {
            match ($action) {
                'accept' => $this->tripService->assignDriver($trip, $authUserId),
                'start' => $this->tripService->startTrip($trip),
                'complete' => $this->tripService->completeTrip($trip),
                'cancel' => $this->tripService->cancelTrip($trip),
            };
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        $trip->refresh();

        return response()->json([
            'message' => match ($action) {
                'accept' => 'Viaje aceptado',
                'start' => 'Viaje iniciado',
                'complete' => 'Viaje completado',
                'cancel' => 'Viaje cancelado',
                default => 'Estado actualizado',
            },
            'trip' => $this->tripToArray($trip),
        ]);
    }

    /**
     * Conductores disponibles (para el pasajero o para asignación).
     */
    public function availableDrivers(Request $request): JsonResponse
    {
        $drivers = $this->tripService->getAvailableDrivers();

        return response()->json([
            'count' => count($drivers),
            'drivers' => array_values($drivers),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function tripToArray(Trip $trip): array
    {
        return [
            'id' => $trip->id,
            'passenger_auth_user_id' => $trip->passenger_auth_user_id,
            'driver_auth_user_id' => $trip->driver_auth_user_id,
            'status' => $trip->status,
            'origin' => [
                'latitude' => (float) $trip->origin_latitude,
                'longitude' => (float) $trip->origin_longitude,
                'address' => $trip->origin_address,
            ],
            'destination' => [
                'latitude' => (float) $trip->destination_latitude,
                'longitude' => (float) $trip->destination_longitude,
                'address' => $trip->destination_address,
            ],
            'requested_at' => $trip->requested_at?->toIso8601String(),
            'accepted_at' => $trip->accepted_at?->toIso8601String(),
            'started_at' => $trip->started_at?->toIso8601String(),
            'completed_at' => $trip->completed_at?->toIso8601String(),
            'cancelled_at' => $trip->cancelled_at?->toIso8601String(),
            'created_at' => $trip->created_at->toIso8601String(),
        ];
    }
}
