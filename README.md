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
    └── trips-service/      # Viajes (pendiente lógica de negocio)
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

Ajusta `DB_HOST=trips-db`, `DB_DATABASE=trips_db`, y `REDIS_HOST=redis`.

**Users Service**

```bash
cd services/users-service
copy .env.docker.example .env
```

Ajusta `DB_HOST=users-db`, `DB_DATABASE=users_db`, `AUTH_SERVICE_URL=http://auth-service:8000`.

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

### 3. URLs vía Gateway

- **Auth:** `http://localhost/auth/api/register`, `http://localhost/auth/api/login`, `http://localhost/auth/api/validate-token`
- **Trips:** `http://localhost/trips/up` (health)
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

## Orden de implementación recomendado

Ver **[docs/PLAN-DE-TRABAJO.md](docs/PLAN-DE-TRABAJO.md)** (Fases 5–13). Resumen: 1) Auth ✅ 2) Users 3) Drivers 4) Trips 5) Realtime 6) Frontend.

## Desarrollo local sin Docker

- **Auth:** `cd services/auth-service && php artisan serve --port=8001`
- **Trips:** `cd services/trips-service && php artisan serve --port=8002`

Usa `.env` con SQLite o MySQL local. Para JWT: `php artisan jwt:secret` en auth-service.

## Notas

- Cada microservicio tiene su propia base de datos (auth_db, trips_db); no se comparten tablas.
- El gateway Nginx reescribe `/auth/*` → auth-service y `/trips/*` → trips-service.
- Los demás servicios (users, drivers, realtime) se pueden añadir al `docker-compose` y al gateway cuando estén listos.
