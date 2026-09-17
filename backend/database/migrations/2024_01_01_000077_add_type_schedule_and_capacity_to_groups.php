<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A group gets a training type (the same four as subscription plans), a weekly
 * schedule and an optional capacity, so a swimmer can pick their group while
 * registering and see how many spots are left. A registration remembers the
 * chosen group so approval puts the swimmer in it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            // Existing groups are "daily": the plain default a club can change.
            $table->string('group_type', 20)->default('daily')->after('name');
            $table->unsignedSmallInteger('capacity')->nullable()->after('group_type');
            $table->json('days_of_week')->nullable()->after('capacity');
            $table->time('start_time')->nullable()->after('days_of_week');
            $table->time('end_time')->nullable()->after('start_time');
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->foreignId('group_id')->nullable()->after('coach_id')
                ->constrained('groups')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('group_id');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn(['group_type', 'capacity', 'days_of_week', 'start_time', 'end_time']);
        });
    }
};
