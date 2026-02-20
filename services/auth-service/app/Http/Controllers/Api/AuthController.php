<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
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

    /**
     * Solicitar restablecimiento de contraseña: genera token, guarda en BD y envía email con enlace.
     * Siempre devuelve el mismo mensaje (no revelar si el email existe).
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->validated('email');

        $user = User::query()->where('email', $email)->first();
        if ($user) {
            $token = Str::random(64);
            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
            $resetUrl = $frontendUrl.'/reset-password?token='.urlencode($token).'&email='.urlencode($email);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                ['token' => $token, 'created_at' => now()]
            );

            Mail::to($email)->send(new ResetPasswordMail($email, $token, $resetUrl));
        }

        return response()->json([
            'message' => 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.',
        ]);
    }

    /**
     * Restablecer contraseña con token recibido por email.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $email = $request->validated('email');
        $token = $request->validated('token');
        $password = $request->validated('password');

        $row = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('token', $token)
            ->first();

        if (! $row || \Illuminate\Support\Carbon::parse($row->created_at)->addMinutes(60)->isPast()) {
            return response()->json(['error' => 'El enlace ha expirado o no es válido. Solicita uno nuevo.'], 422);
        }

        $user = User::query()->where('email', $email)->first();
        if (! $user) {
            return response()->json(['error' => 'Usuario no encontrado.'], 422);
        }

        $user->update(['password' => Hash::make($password)]);
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return response()->json(['message' => 'Contraseña actualizada. Ya puedes iniciar sesión.']);
    }
}
