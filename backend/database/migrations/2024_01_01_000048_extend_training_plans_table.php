<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_plans', function (Blueprint $table) {
            $table->unsignedInteger('duration_weeks')->default(4)->after('description');
            $table->enum('duration_unit', ['weeks', 'months'])->default('weeks')->after('duration_weeks');
            $table->unsignedInteger('sessions_per_week')->default(3)->after('duration_unit');
            $table->text('goals')->nullable()->after('sessions_per_week');
            $table->string('difficulty_level')->default('beginner')->after('goals');
            $table->boolean('is_template')->default(false)->after('difficulty_level');
            $table->foreignId('coach_user_id')->nullable()->after('club_id')->constrained('users')->nullOnDelete();
            $table->json('phases')->nullable()->after('is_template');

            $table->index(['club_id', 'is_template']);
            $table->index(['club_id', 'coach_user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('training_plans', function (Blueprint $table) {
            $table->dropIndex(['club_id', 'is_template']);
            $table->dropIndex(['club_id', 'coach_user_id']);
            $table->dropForeign(['coach_user_id']);
            $table->dropColumn([
                'duration_weeks', 'duration_unit', 'sessions_per_week',
                'goals', 'difficulty_level', 'is_template', 'coach_user_id', 'phases',
            ]);
        });
    }
};
