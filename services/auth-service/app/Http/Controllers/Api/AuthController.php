<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Controlador de autenticación (registro, login, validación de token).
 */
class AuthController extends Controller
{
    /**
     * Registro de nuevo usuario.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::query()->create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make($request->validated('password')),
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'Usuario registrado correctamente',
            'user' => $user->only(['id', 'name', 'email']),
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => (int) config('jwt.ttl') * 60,
        ], 201);
    }

    /**
     * Login: devuelve JWT si las credenciales son válidas.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! $token = JWTAuth::attempt($credentials)) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        $user = auth('api')->user();

        return response()->json([
            'message' => 'Login correcto',
            'user' => $user->only(['id', 'name', 'email']),
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => (int) config('jwt.ttl') * 60,
        ]);
    }

    /**
     * Valida el token JWT y devuelve el usuario actual.
     */
    public function validateToken(): JsonResponse
    {
        $user = auth('api')->user();

        return response()->json([
            'valid' => true,
            'user' => $user->only(['id', 'name', 'email']),
        ]);
    }

    /**
     * Invalida el token actual (logout).
     */
    public function logout(): JsonResponse
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }
}
