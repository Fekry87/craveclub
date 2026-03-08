<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->unsignedInteger('display_order')->default(0)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn('display_order');
        });
    }
};
