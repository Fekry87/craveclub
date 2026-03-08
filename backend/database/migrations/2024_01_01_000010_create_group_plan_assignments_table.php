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
        Schema::create('group_plan_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('training_plans')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['group_id', 'plan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_plan_assignments');
    }
};
