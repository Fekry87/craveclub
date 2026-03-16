web: php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
worker: php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
scheduler: php artisan schedule:work
reverb: php artisan reverb:start --host=0.0.0.0 --port=${REVERB_PORT:-8080}
