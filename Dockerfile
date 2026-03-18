FROM php:8.2-fpm-alpine

RUN apk add --no-cache nginx \
    oniguruma-dev libzip-dev autoconf gcc g++ make \
    && docker-php-ext-install pdo pdo_mysql mbstring zip bcmath pcntl \
    && pecl install redis && docker-php-ext-enable redis \
    && apk del autoconf gcc g++ make

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/ .

RUN mkdir -p storage/logs storage/framework/cache \
    storage/framework/sessions storage/framework/views \
    bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

RUN composer install --no-dev --optimize-autoloader

RUN printf 'worker_processes 1;\n\
events { worker_connections 1024; }\n\
http {\n\
    include mime.types;\n\
    server {\n\
        listen PORT_PLACEHOLDER;\n\
        root /var/www/html/public;\n\
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

CMD ["/bin/sh", "-c", "sed -i \"s/PORT_PLACEHOLDER/${PORT:-8000}/\" /etc/nginx/nginx.conf && php artisan config:cache && php-fpm -D && nginx -g 'daemon off;'"]
