<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // attendance — composite indexes for dashboard & analytics joins
        Schema::table('attendance', function (Blueprint $table) {
            $table->index(['session_id', 'swimmer_id'], 'att_session_swimmer_idx');
            $table->index(['club_id', 'session_id'], 'att_club_session_idx');
        });

        // daily_evaluations — composite for session+swimmer lookups
        Schema::table('daily_evaluations', function (Blueprint $table) {
            $table->index(['session_id', 'swimmer_id'], 'eval_session_swimmer_idx');
        });

        // training_sessions — composite indexes for common query patterns
        Schema::table('training_sessions', function (Blueprint $table) {
            $table->index(['club_id', 'status'], 'ts_club_status_idx');
            if (Schema::hasColumn('training_sessions', 'sport_module_id')) {
                $table->index(['club_id', 'sport_module_id'], 'ts_club_sport_idx');
            }
            $table->index(['coach_user_id', 'date'], 'ts_coach_date_idx');
            $table->index(['club_id', 'date', 'status'], 'ts_club_date_status_idx');
        });

        // group_memberships — composite for group+swimmer lookups
        Schema::table('group_memberships', function (Blueprint $table) {
            $table->index(['group_id', 'swimmer_id'], 'gm_group_swimmer_idx');
        });

        // groups — composite indexes
        Schema::table('groups', function (Blueprint $table) {
            $table->index(['club_id', 'coach_user_id'], 'grp_club_coach_idx');
            if (Schema::hasColumn('groups', 'sport_module_id')) {
                $table->index(['club_id', 'sport_module_id'], 'grp_club_sport_idx');
            }
        });

        // swimmer_profiles — composite for club+created_at analytics
        Schema::table('swimmer_profiles', function (Blueprint $table) {
            $table->index(['club_id', 'created_at'], 'sp_club_created_idx');
            if (Schema::hasColumn('swimmer_profiles', 'group_id')) {
                $table->index('group_id', 'sp_group_idx');
            }
        });

        // notifications — composite for user inbox + club feed
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'read_at'], 'notif_user_read_idx');
            $table->index(['club_id', 'created_at'], 'notif_club_created_idx');
        });

        // registrations — sport module scoped queries
        Schema::table('registrations', function (Blueprint $table) {
            if (Schema::hasColumn('registrations', 'sport_module_id')) {
                $table->index(['club_id', 'sport_module_id', 'status'], 'reg_club_sport_status_idx');
            }
        });

        // training_plan_assignments — swimmer/group status lookups
        Schema::table('training_plan_assignments', function (Blueprint $table) {
            $table->index(['swimmer_profile_id', 'status'], 'tpa_swimmer_status_idx');
            $table->index(['group_id', 'status'], 'tpa_group_status_idx');
        });

        // push_tokens — active token lookups
        Schema::table('push_tokens', function (Blueprint $table) {
            $table->index(['user_id', 'is_active'], 'pt_user_active_idx');
        });
    }

    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropIndex('att_session_swimmer_idx');
            $table->dropIndex('att_club_session_idx');
        });

        Schema::table('daily_evaluations', function (Blueprint $table) {
            $table->dropIndex('eval_session_swimmer_idx');
        });

        Schema::table('training_sessions', function (Blueprint $table) {
            $table->dropIndex('ts_club_status_idx');
            if (Schema::hasColumn('training_sessions', 'sport_module_id')) {
                $table->dropIndex('ts_club_sport_idx');
            }
            $table->dropIndex('ts_coach_date_idx');
            $table->dropIndex('ts_club_date_status_idx');
        });

        Schema::table('group_memberships', function (Blueprint $table) {
            $table->dropIndex('gm_group_swimmer_idx');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropIndex('grp_club_coach_idx');
            if (Schema::hasColumn('groups', 'sport_module_id')) {
                $table->dropIndex('grp_club_sport_idx');
            }
        });

        Schema::table('swimmer_profiles', function (Blueprint $table) {
            $table->dropIndex('sp_club_created_idx');
            if (Schema::hasColumn('swimmer_profiles', 'group_id')) {
                $table->dropIndex('sp_group_idx');
            }
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notif_user_read_idx');
            $table->dropIndex('notif_club_created_idx');
        });

        Schema::table('registrations', function (Blueprint $table) {
            if (Schema::hasColumn('registrations', 'sport_module_id')) {
                $table->dropIndex('reg_club_sport_status_idx');
            }
        });

        Schema::table('training_plan_assignments', function (Blueprint $table) {
            $table->dropIndex('tpa_swimmer_status_idx');
            $table->dropIndex('tpa_group_status_idx');
        });

        Schema::table('push_tokens', function (Blueprint $table) {
            $table->dropIndex('pt_user_active_idx');
        });
    }
};
