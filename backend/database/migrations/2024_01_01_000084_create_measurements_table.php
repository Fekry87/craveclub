<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('session_id')->constrained('training_sessions')->onDelete('cascade');
            $table->foreignId('swimmer_id')->constrained('swimmer_profiles')->onDelete('cascade');
            // restrict: a stroke or distance that has recorded times cannot be
            // deleted out from under them (the Skills page explains why).
            $table->foreignId('stroke_skill_id')->constrained('skills')->onDelete('restrict');
            $table->foreignId('distance_skill_id')->constrained('skills')->onDelete('restrict');
            $table->decimal('time_seconds', 7, 2); // e.g. 32.45 — long-distance times fit too
            $table->foreignId('recorded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->index(['club_id', 'swimmer_id']);
            $table->index(['session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('measurements');
    }
};
