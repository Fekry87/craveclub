<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('notifications:subscription-reminders')->dailyAt('09:00');
Schedule::command('notifications:session-reminders')->dailyAt('08:00');
Schedule::command('queue:health-check')->everyFiveMinutes();
Schedule::command('report:business')->weeklyOn(1, '08:00');
Schedule::command('backup:database')->everyMinute()->withoutOverlapping()->runInBackground();
Schedule::command('accounts:purge')->dailyAt('03:00')->timezone('UTC')->withoutOverlapping();
