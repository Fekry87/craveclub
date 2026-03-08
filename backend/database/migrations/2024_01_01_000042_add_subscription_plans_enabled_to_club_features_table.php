<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('club_features', function (Blueprint $table) {
            $table->boolean('subscription_plans_enabled')->default(true)->after('coach_portal_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('club_features', function (Blueprint $table) {
            $table->dropColumn('subscription_plans_enabled');
        });
    }
};
