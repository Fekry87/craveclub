FROM php:8.2-fpm-alpine

WORKDIR /var/www/html

RUN apk add --no-cache \
    curl \
    libpng-dev \
    oniguruma-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring zip bcmath pcntl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY backend/ .

RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions \
    storage/framework/views bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

RUN composer install --no-dev --optimize-autoloader

CMD php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
