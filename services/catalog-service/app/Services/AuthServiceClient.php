<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP para validar JWT con el Auth Service.
 */
class AuthServiceClient
{
    public function __construct(
        private readonly string $baseUrl
    ) {}

    /**
     * Valida el token JWT con el Auth Service.
     * Devuelve datos del usuario si es válido, null si no.
     *
     * @return array{id: int, name: string, email: string}|null
     */
    public function validateToken(string $bearerToken): ?array
    {
        $url = rtrim($this->baseUrl, '/').'/api/validate-token';

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$bearerToken,
                'Accept' => 'application/json',
            ])->post($url);

            if (! $response->successful()) {
                Log::debug('Auth Service validate-token failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $data = $response->json();
            if (empty($data['valid']) || empty($data['user'])) {
                return null;
            }

            return $data['user'];
        } catch (\Throwable $e) {
            Log::warning('Auth Service request failed', ['message' => $e->getMessage()]);

            return null;
        }
    }
}
