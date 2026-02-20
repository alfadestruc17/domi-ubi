<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Restablecer contraseña</title>
</head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 480px; margin: 0 auto; padding: 1rem;">
    <h1 style="color: #e94560;">Restablecer contraseña</h1>
    <p>Hola,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el enlace de abajo (válido durante 60 minutos):</p>
    <p style="margin: 1.5rem 0;">
        <a href="{{ $resetUrl }}" style="display: inline-block; padding: 0.75rem 1.5rem; background: #e94560; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Restablecer contraseña</a>
    </p>
    <p style="font-size: 0.9rem; color: #666;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
    <p style="font-size: 0.85rem; color: #999; margin-top: 2rem;">— {{ config('app.name') }}</p>
</body>
</html>
