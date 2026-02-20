# Domi-Ubi — Microservicios Laravel (MVP)

Proyecto de microservicios tipo Uber/Domi: Auth, Trips (y futuros Users, Drivers, Realtime). Cada servicio es una aplicación Laravel independiente. Se usa **JWT** para autenticación y **Docker** para el entorno.

**Plan de trabajo:** el desarrollo sigue **13 fases** definidas en **[docs/PLAN-DE-TRABAJO.md](docs/PLAN-DE-TRABAJO.md)**. Ahí está el alcance del MVP, los 5 servicios, el orden de implementación y el estado de cada fase.

## Estructura

```
domi-ubi/
├── docker-compose.yml      # Orquestación: gateway, auth, trips, users, MySQL, Redis, RabbitMQ
├── docker/
│   └── php/
│       └── Dockerfile      # Imagen PHP 8.4-FPM para Laravel
├── gateway/
│   └── nginx.conf          # API Gateway (/auth, /trips, /users)
└── services/
    ├── auth-service/       # Registro, login, JWT, validación de token
    ├── users-service/      # Perfil, roles (cliente/conductor), valida JWT con Auth
    ├── drivers-service/    # Disponibilidad, ubicación, Redis, broadcast (DriverLocationUpdated, DriverAvailabilityChanged)
    ├── trips-service/      # Viajes: crear, estados, asignar conductor, broadcast (TripStatusChanged)
    └── realtime-service/   # Laravel Reverb: WebSockets, canales trip.{id} y drivers
```

## Requisitos

- Docker y Docker Compose
- (Opcional) PHP 8.4+ y Composer para desarrollo local

## Levantar con Docker

### 1. Configurar variables de entorno para Docker

En cada servicio que vaya a correr en Docker, usa la configuración para MySQL y Redis:

**Auth Service**

```bash
cd services/auth-service
copy .env.docker.example .env   # Windows
# cp .env.docker.example .env   # Linux/Mac
```

Edita `.env` y asegúrate de tener:

- `DB_CONNECTION=mysql`
- `DB_HOST=auth-db`
- `DB_DATABASE=auth_db`
- `DB_USERNAME=root`
- `DB_PASSWORD=root`
- `REDIS_HOST=redis`
- `APP_KEY` y `JWT_SECRET` (generados en el paso 2)

**Trips Service**

```bash
cd services/trips-service
copy .env.docker.example .env
```

Ajusta `DB_HOST=trips-db`, `DB_DATABASE=trips_db`, `REDIS_HOST=redis`, `AUTH_SERVICE_URL=http://auth-service:8000`, `DRIVERS_SERVICE_URL=http://drivers-service:8000`.

**Users Service**

```bash
cd services/users-service
copy .env.docker.example .env
```

Ajusta `DB_HOST=users-db`, `DB_DATABASE=users_db`, `AUTH_SERVICE_URL=http://auth-service:8000`.

**Drivers Service**

```bash
cd services/drivers-service
copy .env.docker.example .env
```

Ajusta `DB_HOST=drivers-db`, `DB_DATABASE=drivers_db`, `AUTH_SERVICE_URL=http://auth-service:8000`, `REDIS_HOST=redis`.

**Realtime Service**

```bash
cd services/realtime-service
copy .env.docker.example .env   # o copia .env y ajusta
```

Ajusta `REVERB_APP_ID=domi-ubi`, `REVERB_APP_KEY=domi-ubi-key`, `REVERB_APP_SECRET=domi-ubi-secret`, `REVERB_SERVER_HOST=0.0.0.0`, `REVERB_SERVER_PORT=8080`, `REVERB_HOST=realtime-service`, `REVERB_PORT=8080`, `REVERB_SCHEME=http`. Trips y Drivers usan las mismas credenciales y `REVERB_HOST=realtime-service` para emitir eventos.

### 2. Construir y levantar contenedores

Desde la **raíz del proyecto** (donde está `docker-compose.yml`):

```bash
docker-compose up -d --build
```

Espera a que MySQL esté listo (unos segundos) y luego ejecuta en cada servicio Laravel las migraciones y claves:

**Auth Service**

```bash
docker exec -it auth-service bash
# Dentro del contenedor:
composer install --no-interaction
php artisan key:generate
php artisan jwt:secret
php artisan migrate --force
exit
```

**Trips Service**

```bash
docker exec -it trips-service bash
composer install --no-interaction
php artisan key:generate
php artisan migrate --force
exit
```

**Users Service**

```bash
docker exec -it users-service bash
composer install --no-interaction
php artisan key:generate
php artisan migrate --force
exit
```

**Drivers Service**

```bash
docker exec -it drivers-service bash
composer install --no-interaction
php artisan key:generate
php artisan migrate --force
exit
```

**Realtime Service**

```bash
docker exec -it realtime-service bash
composer install --no-interaction
php artisan key:generate
exit
```

Si prefieres no entrar al contenedor: el **entrypoint** (`docker-entrypoint.sh`) ejecuta `composer install` automáticamente si no existe `vendor/`. Luego arranca en segundo plano `php artisan serve` (puerto 8000) y en primer plano `php artisan reverb:start` (puerto 8080), de modo que Docker envíe señales a Reverb correctamente. No usa MySQL; Reverb escucha en el puerto 8080.

### 3. URLs vía Gateway

- **Auth:** `http://localhost/auth/api/register`, `http://localhost/auth/api/login`, `http://localhost/auth/api/validate-token`
- **Users:** `http://localhost/users/api/profile` (GET/PUT con JWT)
- **Drivers:** `http://localhost/drivers/api/drivers/me`, `http://localhost/drivers/api/drivers/available`, etc.
- **Trips:** `http://localhost/trips/api/trips` (crear/listar viajes con JWT), `http://localhost/trips/up` (health)
- **Realtime (HTTP):** `http://localhost/realtime` (p. ej. broadcasting auth si se usan canales privados)
- **WebSocket (Reverb):** `ws://localhost/app` (conectar con Laravel Echo; clave: `domi-ubi-key`, host: `localhost`, puerto: 80, path: `/app`, scheme: `ws`)
- **RabbitMQ UI:** `http://localhost:15672` (usuario/contraseña: guest/guest)

## Auth Service — Endpoints (JWT)

Todos bajo el prefijo **`/auth`** cuando se usa el gateway (p. ej. `http://localhost/auth/api/...`).

| Método | Ruta              | Descripción        | Auth   |
|--------|-------------------|--------------------|--------|
| POST   | `/api/register`   | Registrar usuario  | No     |
| POST   | `/api/login`     | Login → JWT        | No     |
| POST   | `/api/validate-token` | Validar JWT y devolver usuario | Sí (Bearer) |
| POST   | `/api/logout`    | Invalidar token    | Sí (Bearer) |

### Ejemplo: Registro

```bash
curl -X POST http://localhost/auth/api/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Juan\",\"email\":\"juan@test.com\",\"password\":\"password123\",\"password_confirmation\":\"password123\"}"
```

### Ejemplo: Login

```bash
curl -X POST http://localhost/auth/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"juan@test.com\",\"password\":\"password123\"}"
```

La respuesta incluye `token`. Para rutas protegidas:

```bash
curl -X POST http://localhost/auth/api/validate-token \
  -H "Authorization: Bearer TU_JWT_AQUI"
```

## Users Service — Endpoints (requieren JWT)

Bajo el prefijo **`/users`** (p. ej. `http://localhost/users/api/...`). Todas las rutas requieren **Authorization: Bearer &lt;token&gt;** (el token se valida contra el Auth Service).

| Método | Ruta         | Descripción              |
|--------|--------------|---------------------------|
| GET    | `/api/profile` | Ver perfil del usuario   |
| PUT    | `/api/profile` | Crear o actualizar perfil (name, email, phone, role) |

**Roles:** `customer` (cliente) o `driver` (conductor). Ejemplo de body para PUT: `{"name":"Juan","phone":"+573001234567","role":"driver"}`.

## Drivers Service — Endpoints

Bajo el prefijo **`/drivers`** (p. ej. `http://localhost/drivers/api/...`). Rutas con JWT requieren **Authorization: Bearer &lt;token&gt;** (validado con Auth Service).

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/drivers/available` | Listar conductores disponibles (desde Redis) | No |
| GET | `/api/drivers/me` | Mi estado como conductor | Sí |
| PUT | `/api/drivers/me/availability` | Poner online/offline. Body: `{"available": true, "latitude": 4.6, "longitude": -74.1}` | Sí |
| PUT | `/api/drivers/me/location` | Actualizar ubicación. Body: `{"latitude": 4.6, "longitude": -74.1}` | Sí |

Al ponerse **online** se crea el registro en BD y en Redis (presencia). La ubicación se guarda en MySQL y en Redis para consultas rápidas.

## Trips Service — Endpoints (Fase 8)

Bajo el prefijo **`/trips`**. Todas las rutas requieren **Authorization: Bearer &lt;token&gt;** (validado con Auth Service).

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/trips` | Crear viaje (pasajero). Body: `origin_latitude`, `origin_longitude`, `destination_latitude`, `destination_longitude`, opcional `origin_address`, `destination_address`. Estado inicial: requested → searching_driver. |
| GET | `/api/trips` | Listar mis viajes (como pasajero o conductor). |
| GET | `/api/trips/available-drivers` | Conductores disponibles (consulta al Drivers Service). |
| GET | `/api/trips/{id}` | Ver un viaje (solo si eres pasajero o conductor). |
| PUT | `/api/trips/{id}/status` | Cambiar estado. Body: `{"action": "accept"|"start"|"complete"|"cancel"}`. **accept** = conductor acepta; **start** = conductor inicia; **complete** = conductor finaliza; **cancel** = pasajero o conductor cancela. |

**Estados del viaje:** `requested` → `searching_driver` → `driver_assigned` → `in_progress` → `completed` o `cancelled`. Cada cambio de estado se emite por WebSocket (evento `TripStatusChanged` en el canal `trip.{id}`).

## Realtime Service — WebSockets (Laravel Reverb)

- **URL WebSocket (vía gateway):** `ws://localhost/app`
- **Credenciales (mismo app en Reverb):** `REVERB_APP_ID=domi-ubi`, `REVERB_APP_KEY=domi-ubi-key`, `REVERB_APP_SECRET=domi-ubi-secret`

**Canales públicos (MVP):**

| Canal       | Eventos                | Descripción |
|------------|------------------------|-------------|
| `trip.{id}`| `TripStatusChanged`     | Cambios de estado del viaje (creado, conductor asignado, iniciado, completado, cancelado). |
| `drivers`  | `DriverLocationUpdated`, `DriverAvailabilityChanged` | Ubicación y disponibilidad de conductores en tiempo real. |

Trips Service y Drivers Service tienen `BROADCAST_CONNECTION=reverb` y las variables `REVERB_*` apuntando a `realtime-service:8080` para enviar eventos al servidor Reverb. El frontend puede usar **Laravel Echo** con el driver **reverb** para suscribirse a estos canales.

## Orden de implementación recomendado

Ver **[docs/PLAN-DE-TRABAJO.md](docs/PLAN-DE-TRABAJO.md)** (Fases 5–13). Resumen: 1) Auth ✅ 2) Users ✅ 3) Drivers ✅ 4) Trips ✅ 5) Realtime ✅ 6) Frontend (pendiente).

## Desarrollo local sin Docker

- **Auth:** `cd services/auth-service && php artisan serve --port=8001`
- **Trips:** `cd services/trips-service && php artisan serve --port=8002`

Usa `.env` con SQLite o MySQL local. Para JWT: `php artisan jwt:secret` en auth-service.

## Notas

- Cada microservicio tiene su propia base de datos (auth_db, trips_db); no se comparten tablas.
- El gateway Nginx reescribe `/auth/*` → auth-service y `/trips/*` → trips-service.
- Realtime (Reverb) corre en el mismo contenedor que el servidor HTTP del realtime-service; el gateway expone `/realtime` (HTTP) y `/app` (WebSocket).
