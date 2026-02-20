#!/bin/sh
set -e

cd /var/www

if [ ! -f vendor/autoload.php ]; then
  echo "Instalando dependencias (composer install)..."
  composer install --no-interaction --prefer-dist
fi

php artisan serve --host=0.0.0.0 --port=8000 &

exec php artisan reverb:start
