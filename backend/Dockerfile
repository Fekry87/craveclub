FROM php:8.2-fpm-alpine

# Install system dependencies + nginx
RUN apk add --no-cache \
    nginx \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    zip \
    unzip \
    git \
    curl \
    oniguruma-dev \
    libxml2-dev

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    xml

# Install Redis extension
RUN apk add --no-cache autoconf gcc g++ make \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del autoconf gcc g++ make

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install dependencies (no dev for production)
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader

# Copy application code
COPY . .

# Create empty .env so Laravel can bootstrap
RUN touch /var/www/.env

# Run post-install scripts and pre-generate package manifest
RUN composer run-script post-autoload-dump 2>/dev/null || true \
    && php artisan package:discover --ansi || true

# PHP error logging to stderr
RUN echo "log_errors = On" >> /usr/local/etc/php/conf.d/error-logging.ini \
    && echo "error_log = /proc/self/fd/2" >> /usr/local/etc/php/conf.d/error-logging.ini

# php-fpm: capture worker output
RUN echo "catch_workers_output = yes" >> /usr/local/etc/php-fpm.d/www.conf \
    && echo "decorate_workers_output = no" >> /usr/local/etc/php-fpm.d/www.conf

# Create all required directories and set permissions
# Key: chmod 777 on bootstrap/cache and storage so ANY user can write
RUN mkdir -p /var/www/storage/logs \
    /var/www/storage/framework/cache \
    /var/www/storage/framework/sessions \
    /var/www/storage/framework/views \
    /var/www/bootstrap/cache \
    && chmod -R 777 /var/www/storage /var/www/bootstrap/cache

# Nginx config
RUN printf 'worker_processes 1;\n\
events { worker_connections 1024; }\n\
http {\n\
    include mime.types;\n\
    server {\n\
        listen PORT_PLACEHOLDER;\n\
        root /var/www/public;\n\
        index index.php;\n\
        location / { try_files $uri $uri/ /index.php?$query_string; }\n\
        location ~ \\.php$ {\n\
            fastcgi_pass 127.0.0.1:9000;\n\
            fastcgi_index index.php;\n\
            include fastcgi_params;\n\
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;\n\
        }\n\
    }\n\
}\n' > /etc/nginx/nginx.conf

# Startup script
RUN printf '#!/bin/sh\n\
set -e\n\
# Fix permissions at runtime\n\
chmod -R 777 /var/www/bootstrap/cache /var/www/storage\n\
# Inject Railway PORT into nginx config\n\
sed -i "s/PORT_PLACEHOLDER/${PORT:-8000}/" /etc/nginx/nginx.conf\n\
# Run pending migrations (idempotent — safe on every deploy)\n\
php artisan migrate --force 2>&1 || echo "Migration failed but continuing..."\n\
# Start php-fpm in background\n\
php-fpm -D\n\
# Start nginx in foreground\n\
exec nginx -g "daemon off;"\n\
' > /var/www/start.sh && chmod +x /var/www/start.sh

CMD ["/var/www/start.sh"]
