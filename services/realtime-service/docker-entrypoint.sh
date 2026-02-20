#!/bin/sh
set -e

cd /var/www

# Instalar dependencias si no existen (útil al levantar por primera vez)
if [ ! -f vendor/autoload.php ]; then
  echo "Instalando dependencias (composer install)..."
  composer install --no-interaction --prefer-dist
fi

# Servidor HTTP Laravel en segundo plano (puerto 8000, para /realtime del gateway)
php artisan serve --host=0.0.0.0 --port=8000 &

# Reverb en primer plano (puerto 8080); con exec se convierte en PID 1 y recibe SIGTERM de Docker
exec php artisan reverb:start
