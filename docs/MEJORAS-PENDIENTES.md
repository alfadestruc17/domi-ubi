# Mejoras pendientes y posibles ampliaciones

Lista de lo implementado y qué se puede seguir mejorando.

---

## ✅ Ya implementado

- **¿Olvidaste tu contraseña?** — Enlace en login, página `/forgot-password`, backend envía email con enlace.
- **Restablecer contraseña con email real** — Token en BD (`password_reset_tokens`), Mailable, `POST /auth/api/reset-password`, página `/reset-password?token=...&email=...`. Configurar `MAIL_*` y `FRONTEND_URL` en auth-service.
- **Mapa en Solicitar viaje** — Leaflet + react-leaflet: elegir origen (A) y destino (B) con clic en el mapa.
- **Toasts** — react-toastify: notificaciones de éxito/error en login, registro, perfil, viajes, conductor.

---

## 🔲 Mejoras sugeridas

| Mejora | Descripción |
|--------|-------------|
| **Recordarme** | Checkbox en login para extender duración del token. |
| **Estados de carga** | Skeletons o spinners en listas (viajes, conductores). |
| **Responsive** | Menú hamburguesa y formularios optimizados en móvil. |
| **Página 404** | Vista amigable para rutas inexistentes. |
| **Cambio de contraseña (logueado)** | En Perfil: "Cambiar contraseña" con endpoint en auth. |
| **Paginación** | En listado de viajes `GET /trips?page=1&per_page=10`. |
| **Comunicación asíncrona (Fase 10)** | Eventos RabbitMQ entre servicios. |

---

## Configuración para restablecer contraseña (email real)

En **auth-service** `.env`:

- `FRONTEND_URL=http://localhost:5173` — URL del frontend (enlace del correo).
- `MAIL_MAILER=smtp`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` — Para envío real (Mailtrap, SendGrid, etc.). Con `MAIL_MAILER=log` el correo se escribe en `storage/logs/laravel.log` y no se envía.

Ejecutar migración en auth-service: `php artisan migrate` (incluye `password_reset_tokens`).
