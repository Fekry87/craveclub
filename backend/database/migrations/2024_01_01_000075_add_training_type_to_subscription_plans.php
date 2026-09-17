<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Plans are grouped by how often the member trains — every day, two or three
 * days a week, or private sessions — and each group has its own monthly,
 * quarterly, annual… plans. Existing plans land in "daily" so nothing breaks;
 * managers re-file them from the portal.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->string('training_type', 32)->default('daily')->after('name')->index();
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropIndex(['training_type']);
            $table->dropColumn('training_type');
        });
    }
};
