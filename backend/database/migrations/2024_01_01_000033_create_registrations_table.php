<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('coach_id')->constrained('coach_profiles')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('subscription_plans')->onDelete('cascade');

            // Personal info
            $table->string('full_name');
            $table->string('phone');
            $table->string('gender'); // male, female
            $table->date('birth_date');
            $table->string('avatar_url')->nullable();
            $table->integer('height_cm')->nullable();
            $table->integer('weight_kg')->nullable();
            $table->string('fitness_level')->nullable(); // excellent, good, average, beginner
            $table->boolean('prior_experience')->default(false);
            $table->text('medical_notes')->nullable();

            // Sport info
            $table->json('sport_ids');
            $table->string('experience_level')->nullable(); // beginner, intermediate, advanced, professional
            $table->string('years_experience')->nullable();
            $table->boolean('competed')->default(false);

            // Preferences
            $table->string('primary_goal')->nullable();
            $table->string('weekly_frequency')->nullable();
            $table->string('preferred_time')->nullable();

            // Payment & status
            $table->string('payment_method')->default('cash'); // cash
            $table->string('status')->default('pending'); // pending, approved, active, cancelled
            $table->decimal('total_amount', 8, 2);

            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
