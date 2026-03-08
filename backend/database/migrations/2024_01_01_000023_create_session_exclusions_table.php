<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_exclusions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('session_id')->constrained('training_sessions')->onDelete('cascade');
            $table->foreignId('swimmer_id')->constrained('swimmer_profiles')->onDelete('cascade');
            $table->string('reason')->nullable();
            $table->timestamps();
            $table->unique(['session_id', 'swimmer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_exclusions');
    }
};
