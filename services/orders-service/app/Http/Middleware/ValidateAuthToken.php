<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\AuthServiceClient;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateAuthToken
{
    public function __construct(
        private readonly AuthServiceClient $authClient
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization');
        if (! $header || ! str_starts_with($header, 'Bearer ')) {
            return response()->json(['error' => 'Token no proporcionado'], 401);
        }

        $token = substr($header, 7);
        $user = $this->authClient->validateToken($token);

        if ($user === null) {
            return response()->json(['error' => 'Token inválido o expirado'], 401);
        }

        $request->attributes->set('auth_user', $user);
        $request->attributes->set('auth_user_id', (int) $user['id']);

        return $next($request);
    }
}
