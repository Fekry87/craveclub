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
        Schema::create('training_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('training_plans')->onDelete('cascade');
            $table->integer('sort_order')->default(0);
            $table->string('stroke')->nullable();
            $table->string('drill')->nullable();
            $table->string('distance')->nullable();
            $table->integer('reps')->nullable();
            $table->string('interval')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_plan_items');
    }
};
