# Mejoras pendientes y posibles ampliaciones

Lista de lo que ya se añadió y qué se puede seguir mejorando.

---

## ✅ Añadido en esta iteración

- **¿Olvidaste tu contraseña?**  
  - Enlace en la pantalla de login.  
  - Página `/forgot-password` donde se ingresa el correo.  
  - Backend: `POST /auth/api/forgot-password` (por ahora solo responde mensaje genérico, sin envío de email).

---

## 🔲 Mejoras de interfaz sugeridas

| Mejora | Descripción |
|--------|-------------|
| **Restablecer contraseña con email real** | En auth-service: guardar token de reset en BD, configurar mail (SMTP/Mailtrap), enviar enlace con token y crear página "Nueva contraseña" (`/reset-password?token=...`). |
| **Recordarme** | Checkbox en login para extender duración del token o usar `localStorage` con expiración más larga. |
| **Toasts / notificaciones** | Usar React Toastify o similar para éxito/error en lugar de solo mensajes inline. |
| **Mapa real** | Integrar Leaflet o Mapbox en "Solicitar viaje" para elegir origen/destino en el mapa en lugar de solo coordenadas. |
| **Estados de carga** | Skeletons o spinners en listas (viajes, conductores) mientras cargan. |
| **Responsive** | Revisar menú y formularios en móvil (hamburguesa, tamaños de botón). |
| **Página 404** | Vista amigable para rutas inexistentes en lugar de redirigir siempre a `/`. |
| **Cambio de contraseña (logueado)** | En Perfil: "Cambiar contraseña" con contraseña actual + nueva (y endpoint en auth o users). |

---

## 🔲 Backend / funcionalidad

| Mejora | Descripción |
|--------|-------------|
| **Email en forgot-password** | Configurar `.env` (MAIL_*), tabla `password_reset_tokens`, job para enviar correo y endpoint `POST /reset-password`. |
| **Paginación** | En listado de viajes (`GET /trips`) usar `?page=1&per_page=10`. |
| **Filtros** | Viajes por estado, fecha, etc. |
| **Comunicación asíncrona (Fase 10)** | Eventos RabbitMQ entre servicios (ej. TripRequested, DriverAssigned). |

---

## Cómo priorizar

1. **MVP cerrado:** Olvidaste contraseña (flujo actual) + mejoras de UX que más impacten (toasts, carga).  
2. **Después:** Email real en restablecer contraseña, mapa en solicitar viaje.  
3. **Opcional:** Recordarme, 404, cambio de contraseña en perfil, paginación y eventos.
