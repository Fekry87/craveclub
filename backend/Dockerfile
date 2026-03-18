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

# Run post-install scripts
RUN composer run-script post-autoload-dump 2>/dev/null || true

# Create empty .env so Laravel can bootstrap (Railway injects env vars at runtime)
RUN touch /var/www/.env

# Enable PHP error logging to stderr (visible in Railway logs)
RUN echo "log_errors = On" >> /usr/local/etc/php/conf.d/error-logging.ini \
    && echo "error_log = /proc/self/fd/2" >> /usr/local/etc/php/conf.d/error-logging.ini \
    && echo "display_errors = On" >> /usr/local/etc/php/conf.d/error-logging.ini

# Enable php-fpm to capture worker output in logs
RUN echo "catch_workers_output = yes" >> /usr/local/etc/php-fpm.d/www.conf \
    && echo "decorate_workers_output = no" >> /usr/local/etc/php-fpm.d/www.conf

# Set permissions
RUN mkdir -p /var/www/storage/logs \
    /var/www/storage/framework/cache \
    /var/www/storage/framework/sessions \
    /var/www/storage/framework/views \
    /var/www/bootstrap/cache \
    && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Nginx config template (PORT_PLACEHOLDER replaced at runtime)
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

CMD ["/bin/sh", "-c", "sed -i \"s/PORT_PLACEHOLDER/${PORT:-8000}/\" /etc/nginx/nginx.conf && php artisan route:cache && php artisan view:cache && php-fpm -D && nginx -g 'daemon off;'"]
