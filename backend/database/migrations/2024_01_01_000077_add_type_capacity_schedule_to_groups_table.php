<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A group's own fixed weekly template: what kind of group it is, how many
     * members it takes, and when it meets. This is separate from RecurringSchedule,
     * which generates dated TrainingSession rows over a period.
     */
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            // App\Enums\TrainingType: daily | three_days | two_days | private
            $table->string('group_type', 20)->default('daily')->after('description');
            $table->unsignedInteger('capacity')->nullable()->after('group_type');
            // Ints 0-6, 0 = Sunday, same convention as recurring_schedules.days_of_week
            $table->json('days_of_week')->nullable()->after('capacity');
            $table->time('start_time')->nullable()->after('days_of_week');
            $table->time('end_time')->nullable()->after('start_time');
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn(['group_type', 'capacity', 'days_of_week', 'start_time', 'end_time']);
        });
    }
};
