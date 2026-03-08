<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaderboard_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('rating_xp_1')->default(10);
            $table->unsignedInteger('rating_xp_2')->default(25);
            $table->unsignedInteger('rating_xp_3')->default(50);
            $table->unsignedInteger('rating_xp_4')->default(80);
            $table->unsignedInteger('rating_xp_5')->default(120);
            $table->unsignedInteger('attendance_xp')->default(5);
            $table->unsignedInteger('streak_bonus_xp')->default(10);
            $table->unsignedInteger('streak_threshold')->default(3);
            $table->timestamps();
        });

        Schema::create('level_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('xp_threshold');
            $table->string('color', 7)->default('#CD7F32');
            $table->string('icon')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['club_id', 'xp_threshold']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('level_tiers');
        Schema::dropIfExists('leaderboard_settings');
    }
};
