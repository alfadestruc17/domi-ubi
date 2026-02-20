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

### ✅ Hecho

| Fase | Qué está hecho |
|------|----------------|
| **1** | Alcance MVP definido (actores, flujo, sin Uber completo). |
| **2** | Arquitectura definida: 5 servicios, cada uno Laravel independiente. |
| **3** | Docker: `docker-compose` con gateway, auth, trips, users, **drivers**, auth-db, trips-db, users-db, **drivers-db**, Redis, RabbitMQ. PHP 8.4. |
| **4** | Servicios Laravel creados: **auth-service**, **trips-service**, **users-service**, **drivers-service**, **realtime-service**. |
| **5** | **Auth Service** completo: registro, login, JWT, validate-token, logout. MySQL en .env. |
| **6** | **Users Service**: perfil (GET/PUT), roles (customer/driver), validación JWT vía Auth Service. |
| **7** | **Drivers Service**: disponibilidad (online/offline), ubicación, Redis (presencia), broadcast (DriverLocationUpdated, DriverAvailabilityChanged). |
| **8** | **Trips Service**: crear viaje, estados, asignar conductor, integración Auth/Drivers, broadcast (TripStatusChanged). |
| **9** | **Realtime Service**: Laravel Reverb (WebSockets). Canales públicos `trip.{id}` y `drivers`. Trips y Drivers emiten eventos a Reverb. |
| **13** | **API Gateway**: Nginx con `/auth`, `/trips`, `/users`, **`/drivers`**, **`/realtime`** y WebSocket **`/app`** (Reverb). |

### 🔲 Falta por hacer

| Fase | Qué falta |
|------|-----------|
| **10** | Comunicación: Trips → Auth (validar JWT), Trips → Users/Drivers (HTTP); luego eventos RabbitMQ/Redis. |
| **11** | Redis: seguir usando para cache/session; presencia conductores y estado en vivo (parcialmente hecho). |
| **12** | Frontend React: login, mapa, solicitud viaje, vista conductor, estados en vivo. |

### Próximo paso recomendado

**Fase 10 / 12:** Refinar comunicación asincrónica (RabbitMQ) o avanzar con **Frontend React** (login, mapa, Echo para WebSockets).

---

*Documento vivo: actualizar esta sección según se avance.*
