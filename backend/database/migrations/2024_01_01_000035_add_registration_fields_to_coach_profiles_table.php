<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->json('sport_ids')->nullable()->after('club_id');
            $table->integer('experience_years')->nullable()->after('phone');
            $table->json('certifications')->nullable()->after('experience_years');
            $table->decimal('rating', 3, 2)->nullable()->after('certifications');
            $table->integer('current_swimmers_count')->default(0)->after('rating');
            $table->boolean('is_active')->default(true)->after('current_swimmers_count');
        });
    }

    public function down(): void
    {
        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->dropColumn(['sport_ids', 'experience_years', 'certifications', 'rating', 'current_swimmers_count', 'is_active']);
        });
    }
};
