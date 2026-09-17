<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leaderboard_settings', function (Blueprint $table) {
            $table->unsignedInteger('award_day_xp')->default(50)->after('streak_threshold');
            $table->unsignedInteger('award_week_xp')->default(150)->after('award_day_xp');
            $table->unsignedInteger('award_month_xp')->default(400)->after('award_week_xp');
        });
    }

    public function down(): void
    {
        Schema::table('leaderboard_settings', function (Blueprint $table) {
            $table->dropColumn(['award_day_xp', 'award_week_xp', 'award_month_xp']);
        });
    }
};
