<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Perfil de usuario (datos y rol). Requiere JWT validado por Auth Service.
 */
class ProfileController extends Controller
{
    /**
     * Obtener el perfil del usuario autenticado.
     * Si no existe perfil, se crea uno básico con datos del Auth Service.
     */
    public function show(Request $request): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        $authUser = $request->attributes->get('auth_user', []);

        $profile = Profile::query()->where('auth_user_id', $authUserId)->first();

        if (! $profile) {
            return response()->json([
                'message' => 'Completa tu perfil',
                'profile' => null,
                'auth_user' => $authUser,
            ], 200);
        }

        return response()->json([
            'profile' => $profile->only(['id', 'auth_user_id', 'name', 'email', 'phone', 'role']),
        ]);
    }

    /**
     * Crear o actualizar perfil.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $authUserId = (int) $request->attributes->get('auth_user_id');
        $authUser = $request->attributes->get('auth_user', []);

        $profile = Profile::query()->where('auth_user_id', $authUserId)->first();

        if (! $profile) {
            $profile = Profile::query()->create([
                'auth_user_id' => $authUserId,
                'name' => $request->validated('name', $authUser['name'] ?? ''),
                'email' => $request->validated('email', $authUser['email'] ?? ''),
                'phone' => $request->validated('phone'),
                'role' => $request->validated('role', Profile::ROLE_CUSTOMER),
            ]);

            return response()->json([
                'message' => 'Perfil creado correctamente',
                'profile' => $profile->only(['id', 'auth_user_id', 'name', 'email', 'phone', 'role']),
            ], 201);
        }

        $profile->update($request->validated());

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'profile' => $profile->only(['id', 'auth_user_id', 'name', 'email', 'phone', 'role']),
        ]);
    }
}
