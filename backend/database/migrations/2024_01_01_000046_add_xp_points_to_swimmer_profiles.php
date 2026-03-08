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
        Schema::table('swimmer_profiles', function (Blueprint $table) {
            $table->unsignedInteger('xp_points')->default(0);
            $table->unsignedInteger('xp_rank')->nullable();
            $table->index(['club_id', 'xp_points']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('swimmer_profiles', function (Blueprint $table) {
            $table->dropIndex(['club_id', 'xp_points']);
            $table->dropColumn(['xp_points', 'xp_rank']);
        });
    }
};
