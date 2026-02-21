<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP para el Drivers Service (conductores disponibles para asignar pedidos).
 */
class DriversServiceClient
{
    public function __construct(
        private readonly string $baseUrl
    ) {}

    /**
     * Lista de conductores disponibles (desde Redis).
     *
     * @return array<int, array{auth_user_id: int, latitude: float, longitude: float, updated_at: string}>
     */
    public function getAvailableDrivers(): array
    {
        $url = rtrim($this->baseUrl, '/').'/api/drivers/available';

        try {
            $response = Http::acceptJson()->get($url);
            if (! $response->successful()) {
                Log::debug('Drivers Service available failed', ['status' => $response->status()]);
                return [];
            }
            $data = $response->json();
            $drivers = $data['drivers'] ?? [];
            return is_array($drivers) ? $drivers : [];
        } catch (\Throwable $e) {
            Log::warning('Drivers Service request failed', ['message' => $e->getMessage()]);
            return [];
        }
    }
}
