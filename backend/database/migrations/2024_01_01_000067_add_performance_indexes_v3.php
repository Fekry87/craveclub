<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // attendance — covering index for "count present by session" pattern
        // Used by: ClubAnalyticsService (attendance trend, coach detail, retention)
        Schema::table('attendance', function (Blueprint $table) {
            $table->index(['session_id', 'present'], 'att_session_present_idx');
        });

        // daily_evaluations — covering index for rating aggregation GROUP BY
        // Used by: ClubAnalyticsService.getCoachDetail() rating distribution
        Schema::table('daily_evaluations', function (Blueprint $table) {
            $table->index(['session_id', 'rating'], 'eval_session_rating_idx');
        });

        // training_plan_assignments — covering index for active plan lookups
        // Used by: SwimmerWeeklyReportService.getCurrentPlanPhase()
        Schema::table('training_plan_assignments', function (Blueprint $table) {
            $table->index(['club_id', 'swimmer_profile_id', 'status'], 'tpa_club_swimmer_status_idx');
            $table->index(['club_id', 'group_id', 'status'], 'tpa_club_group_status_idx');
        });

        // training_sessions — group+date+status for coach detail weekly queries
        // Used by: ClubAnalyticsService.getCoachDetail() attendance by week
        Schema::table('training_sessions', function (Blueprint $table) {
            $table->index(['group_id', 'date', 'status'], 'ts_group_date_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropIndex('att_session_present_idx');
        });

        Schema::table('daily_evaluations', function (Blueprint $table) {
            $table->dropIndex('eval_session_rating_idx');
        });

        Schema::table('training_plan_assignments', function (Blueprint $table) {
            $table->dropIndex('tpa_club_swimmer_status_idx');
            $table->dropIndex('tpa_club_group_status_idx');
        });

        Schema::table('training_sessions', function (Blueprint $table) {
            $table->dropIndex('ts_group_date_status_idx');
        });
    }
};
