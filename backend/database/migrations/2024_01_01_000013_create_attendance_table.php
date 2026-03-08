<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('session_id')->constrained('training_sessions')->onDelete('cascade');
            $table->foreignId('swimmer_id')->constrained('swimmer_profiles')->onDelete('cascade');
            $table->boolean('present')->default(false);
            $table->timestamps();

            $table->unique(['session_id', 'swimmer_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};
