# Plan de trabajo — Domi-Ubi (MVP microservicios)

Este documento define el alcance y el orden de desarrollo del proyecto. **Se desarrolla en 13 fases.** No saltar fases; cada una depende de la anterior.

---

## FASE 1 — Definir alcance (CRÍTICO)

Antes de tocar código, reducir el caos.

- **No** intentar construir Uber completo. Empezar con un **MVP funcional**.

### MVP inteligente

**Actores:**
- Usuario (cliente)
- Conductor / repartidor

**Flujo base:**
1. Registro / login
2. Usuario solicita viaje / pedido
3. Sistema busca conductor
4. Conductor acepta / rechaza
5. Estados en tiempo real
6. Finalizar viaje
7. Pago simulado

**Si esto funciona → ya tienes un proyecto MUY sólido.**

---

## FASE 2 — Definir arquitectura de microservicios

- Cada servicio = **proyecto Laravel independiente**.
- No compartir modelos, controladores ni bases de datos entre servicios.

### Servicios iniciales (mínimos viables)

Empezar **solo** con estos:

| Servicio | Responsabilidad principal |
|----------|---------------------------|
| **Auth Service** | Identidad, JWT |
| **Users Service** | Perfil, roles (cliente/conductor) |
| **Trips Service** | Viajes, estados, asignación |
| **Drivers Service** | Disponibilidad, ubicación |
| **Realtime / Notifications Service** | WebSockets, eventos en vivo |

**NO** empezar con: pagos, pricing, analytics.

---

## FASE 3 — Preparar entorno (Docker)

- Usar **Docker** desde el inicio.
- Servicios típicos:
  - PHP / Laravel (contenedores por servicio)
  - MySQL (uno por servicio o compartido al inicio)
  - Redis
  - RabbitMQ
  - Nginx (gateway)

Estructura objetivo:

```
/services
    /auth-service
    /users-service
    /trips-service
    /drivers-service
    /realtime-service
```

---

## FASE 4 — Crear microservicios Laravel

- Cada servicio = `composer create-project laravel/laravel <nombre>-service`.
- Repetir por servicio. Mantener cada uno independiente (su propio `composer.json`, `.env`, BD).

---

## FASE 5 — Auth Service (SIEMPRE primero)

**Responsabilidades:**
- Registro
- Login
- Emisión de JWT
- Validación de tokens

**Paquetes:** Laravel Sanctum **o** tymon/jwt-auth.

**Endpoints base:**
- `POST /register`
- `POST /login`
- `POST /validate-token`

Todos los demás servicios confiarán en este para validar identidad.

---

## FASE 6 — Users Service

- **NO** mezclar auth + usuarios (error típico).

**Responsabilidades:**
- Perfil de usuario
- Roles (cliente / conductor)
- Datos personales

**Comunicación:**
- Auth Service → valida identidad (JWT).
- Users Service → maneja datos de perfil y roles.

---

## FASE 7 — Drivers Service

**Responsabilidades:**
- Disponibilidad (online/offline)
- Ubicación actual
- Estado del conductor

**Tecnologías:**
- Redis (estado rápido, presencia)
- Eventos (para notificar cambios)

---

## FASE 8 — Trips Service (núcleo del negocio)

**Responsabilidades:**
- Crear viaje
- Asignar conductor
- Gestionar estados del viaje

**Estados típicos:**
- `requested`
- `searching_driver`
- `driver_assigned`
- `in_progress`
- `completed`
- `cancelled`

Ideal para **arquitectura orientada a eventos** (event-driven).

---

## FASE 9 — Realtime / Notifications Service

**Responsabilidades:**
- WebSockets
- Broadcast de eventos
- Estados en vivo (para cliente y conductor)

**Opciones:** Laravel Reverb, Pusher, Socket.io bridge.

**Eventos típicos:**
- `DriverLocationUpdated`
- `TripStatusChanged`
- `DriverAssigned`

---

## FASE 10 — Comunicación entre microservicios

**Dos modelos:**

| Modelo | Uso | Ejemplo |
|--------|-----|---------|
| **Sincrónico** | Simple al inicio, fácil de depurar | HTTP: Trips → Drivers, Trips → Users, todos → Auth |
| **Asincrónico** | Más realista y escalable | RabbitMQ / Redis: `TripRequested`, `DriverAssigned`, `TripCompleted` |

---

## FASE 11 — Redis (clave)

**Usos en este sistema:**
- Estados en tiempo real
- Locks
- Cache
- Ubicaciones
- Presencia de conductores

MySQL **no** sustituye a Redis para estos casos.

---

## FASE 12 — Frontend (React recomendado)

**Pantallas mínimas:**
- Login / registro
- Mapa / solicitud de viaje
- Vista conductor
- Estados en vivo

**Librerías útiles:** React, Axios, Socket client, Tailwind / MUI, Mapbox / Google Maps.

---

## FASE 13 — API Gateway

- Evitar que el frontend conozca muchas URLs (una por servicio).
- Opciones: Nginx, Kong, Traefik.

**Ejemplo de rutas unificadas:**
- `api.midominio.com/auth`
- `api.midominio.com/trips`
- `api.midominio.com/drivers`
- `api.midominio.com/users`
- `api.midominio.com/realtime` (o WebSocket aparte)

---

## Orden recomendado de implementación

1. **Auth Service** ✅ (hecho en este repo)
2. **Users Service**
3. **Drivers Service**
4. **Trips Service**
5. **Realtime Service**
6. **Frontend (React)**

Las fases 3 (Docker) y 13 (Gateway) ya están iniciadas en el repo; se irán completando según se añadan servicios.

---

## Resumen de estado (referencia)

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Alcance MVP | Definido |
| 2 | Arquitectura microservicios | Definida |
| 3 | Entorno Docker | En uso (gateway, auth, trips, MySQL, Redis, RabbitMQ) |
| 4 | Crear servicios Laravel | Auth y Trips creados; faltan Users, Drivers, Realtime |
| 5 | Auth Service | Hecho (JWT, register, login, validate-token) |
| 6 | Users Service | Pendiente |
| 7 | Drivers Service | Pendiente |
| 8 | Trips Service | Estructura lista; lógica de negocio pendiente |
| 9 | Realtime Service | Pendiente |
| 10 | Comunicación entre servicios | Parcial (HTTP; eventos pendientes) |
| 11 | Redis | En uso (cache/session); ampliar para presencia/estado |
| 12 | Frontend React | Pendiente |
| 13 | API Gateway | Nginx configurado; ampliar con nuevos servicios |

---

*Documento vivo: actualizar la tabla de estado según se avance en cada fase.*
