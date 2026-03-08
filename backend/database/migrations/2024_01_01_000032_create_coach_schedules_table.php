<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coach_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')->constrained('coach_profiles')->onDelete('cascade');
            $table->string('day_of_week');
            $table->json('slots');
            $table->timestamps();

            $table->unique(['coach_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_schedules');
    }
};
