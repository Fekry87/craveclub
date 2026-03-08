<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('club_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('leaderboard_enabled')->default(true);
            $table->boolean('evaluations_enabled')->default(true);
            $table->boolean('skills_enabled')->default(true);
            $table->boolean('training_plans_enabled')->default(true);
            $table->boolean('attendance_tracking_enabled')->default(true);
            $table->boolean('swimmer_accounts_enabled')->default(true);
            $table->boolean('coach_portal_enabled')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('club_features');
    }
};
