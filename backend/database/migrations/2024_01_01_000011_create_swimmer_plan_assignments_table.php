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
        Schema::create('swimmer_plan_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('swimmer_id')->constrained('swimmer_profiles')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('training_plans')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['swimmer_id', 'plan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('swimmer_plan_assignments');
    }
};
