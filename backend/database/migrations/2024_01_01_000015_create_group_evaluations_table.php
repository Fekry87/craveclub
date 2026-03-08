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
        Schema::create('group_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('session_id')->constrained('training_sessions')->onDelete('cascade');
            $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
            $table->integer('rating');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['session_id', 'group_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_evaluations');
    }
};
