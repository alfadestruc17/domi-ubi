# Domi-Ubi: bajar todo, levantar de nuevo y ejecutar setup básico.
# Ejecutar desde la raíz del proyecto: .\scripts\start-fresh.ps1
# Opcional: -WipeDatabases para borrar volúmenes (empezar BBDD desde cero).

param(
    [switch]$WipeDatabases
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

Write-Host "=== Domi-Ubi: arranque desde cero ===" -ForegroundColor Cyan

# 1. Bajar contenedores
Write-Host "`n1. Bajando contenedores..." -ForegroundColor Yellow
if ($WipeDatabases) {
    docker-compose down -v
} else {
    docker-compose down
}

# 2. Levantar todo
Write-Host "`n2. Levantando contenedores (build)..." -ForegroundColor Yellow
docker-compose up -d --build

Write-Host "`n3. Esperando 15 s a que MySQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 3. Setup Auth
Write-Host "`n4. Setup Auth Service..." -ForegroundColor Yellow
docker exec auth-service sh -c "composer install --no-interaction && php artisan key:generate && php artisan jwt:secret && php artisan migrate --force"

# 4. Setup Users
Write-Host "`n5. Setup Users Service..." -ForegroundColor Yellow
docker exec users-service sh -c "composer install --no-interaction && php artisan key:generate && php artisan migrate --force"

# 5. Setup Drivers
Write-Host "`n6. Setup Drivers Service..." -ForegroundColor Yellow
docker exec drivers-service sh -c "composer install --no-interaction && php artisan key:generate && php artisan migrate --force"

# 6. Setup Trips
Write-Host "`n7. Setup Trips Service..." -ForegroundColor Yellow
docker exec trips-service sh -c "composer install --no-interaction && php artisan key:generate && php artisan migrate --force"

# 7. Setup Catalog
Write-Host "`n8. Setup Catalog Service..." -ForegroundColor Yellow
docker exec catalog-service sh -c "composer install --no-interaction && php artisan key:generate && php artisan migrate --force && php artisan db:seed --force"

# 8. Setup Orders
Write-Host "`n9. Setup Orders Service..." -ForegroundColor Yellow
docker exec orders-service sh -c "composer install --no-interaction && php artisan key:generate && php artisan migrate --force"

# 9. Setup Realtime
Write-Host "`n10. Setup Realtime Service..." -ForegroundColor Yellow
docker exec realtime-service sh -c "composer install --no-interaction && php artisan key:generate"

Write-Host "`n=== Listo ===" -ForegroundColor Green
Write-Host "Gateway: http://localhost"
Write-Host "Frontend (en otra terminal): cd frontend; npm install; npm run dev  -> http://localhost:5173"
Write-Host ""
