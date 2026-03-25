web: sed -i "s/PORT_PLACEHOLDER/${PORT:-8000}/" /etc/nginx/nginx.conf && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan migrate --force 2>&1 && php artisan admin:create --force 2>&1 && php-fpm -D && nginx -g 'daemon off;'
worker: php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
scheduler: php artisan schedule:work
reverb: php artisan reverb:start --host=0.0.0.0 --port=${REVERB_PORT:-8080}
