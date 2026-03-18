<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Safely add an index only if the table and all columns exist.
     */
    private function addIndexIfColumnsExist(string $table, array $columns, string $indexName): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        foreach ($columns as $col) {
            if (! Schema::hasColumn($table, $col)) {
                return;
            }
        }

        Schema::table($table, function (Blueprint $blueprint) use ($columns, $indexName) {
            $blueprint->index($columns, $indexName);
        });
    }

    /**
     * Safely drop an index only if the table exists.
     */
    private function dropIndexIfExists(string $table, string $indexName): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($indexName) {
            $blueprint->dropIndex($indexName);
        });
    }

    public function up(): void
    {
        // attendance — composite indexes for dashboard & analytics joins
        $this->addIndexIfColumnsExist('attendance', ['session_id', 'swimmer_id'], 'att_session_swimmer_idx');
        $this->addIndexIfColumnsExist('attendance', ['club_id', 'session_id'], 'att_club_session_idx');

        // daily_evaluations — composite for session+swimmer lookups
        $this->addIndexIfColumnsExist('daily_evaluations', ['session_id', 'swimmer_id'], 'eval_session_swimmer_idx');

        // training_sessions — composite indexes for common query patterns
        $this->addIndexIfColumnsExist('training_sessions', ['club_id', 'status'], 'ts_club_status_idx');
        $this->addIndexIfColumnsExist('training_sessions', ['club_id', 'sport_module_id'], 'ts_club_sport_idx');
        $this->addIndexIfColumnsExist('training_sessions', ['coach_user_id', 'date'], 'ts_coach_date_idx');
        $this->addIndexIfColumnsExist('training_sessions', ['club_id', 'date', 'status'], 'ts_club_date_status_idx');

        // group_memberships — composite for group+swimmer lookups
        $this->addIndexIfColumnsExist('group_memberships', ['group_id', 'swimmer_id'], 'gm_group_swimmer_idx');

        // groups — composite indexes
        $this->addIndexIfColumnsExist('groups', ['club_id', 'coach_user_id'], 'grp_club_coach_idx');
        $this->addIndexIfColumnsExist('groups', ['club_id', 'sport_module_id'], 'grp_club_sport_idx');

        // swimmer_profiles — composite for club+created_at analytics
        $this->addIndexIfColumnsExist('swimmer_profiles', ['club_id', 'created_at'], 'sp_club_created_idx');
        $this->addIndexIfColumnsExist('swimmer_profiles', ['group_id'], 'sp_group_idx');

        // notifications — composite for user inbox + club feed
        $this->addIndexIfColumnsExist('notifications', ['user_id', 'read_at'], 'notif_user_read_idx');
        $this->addIndexIfColumnsExist('notifications', ['club_id', 'created_at'], 'notif_club_created_idx');

        // registrations — sport module scoped queries
        $this->addIndexIfColumnsExist('registrations', ['club_id', 'sport_module_id', 'status'], 'reg_club_sport_status_idx');

        // training_plan_assignments — swimmer/group status lookups
        $this->addIndexIfColumnsExist('training_plan_assignments', ['swimmer_profile_id', 'status'], 'tpa_swimmer_status_idx');
        $this->addIndexIfColumnsExist('training_plan_assignments', ['group_id', 'status'], 'tpa_group_status_idx');

        // push_tokens — active token lookups
        $this->addIndexIfColumnsExist('push_tokens', ['user_id', 'is_active'], 'pt_user_active_idx');
    }

    public function down(): void
    {
        $this->dropIndexIfExists('attendance', 'att_session_swimmer_idx');
        $this->dropIndexIfExists('attendance', 'att_club_session_idx');
        $this->dropIndexIfExists('daily_evaluations', 'eval_session_swimmer_idx');
        $this->dropIndexIfExists('training_sessions', 'ts_club_status_idx');
        $this->dropIndexIfExists('training_sessions', 'ts_club_sport_idx');
        $this->dropIndexIfExists('training_sessions', 'ts_coach_date_idx');
        $this->dropIndexIfExists('training_sessions', 'ts_club_date_status_idx');
        $this->dropIndexIfExists('group_memberships', 'gm_group_swimmer_idx');
        $this->dropIndexIfExists('groups', 'grp_club_coach_idx');
        $this->dropIndexIfExists('groups', 'grp_club_sport_idx');
        $this->dropIndexIfExists('swimmer_profiles', 'sp_club_created_idx');
        $this->dropIndexIfExists('swimmer_profiles', 'sp_group_idx');
        $this->dropIndexIfExists('notifications', 'notif_user_read_idx');
        $this->dropIndexIfExists('notifications', 'notif_club_created_idx');
        $this->dropIndexIfExists('registrations', 'reg_club_sport_status_idx');
        $this->dropIndexIfExists('training_plan_assignments', 'tpa_swimmer_status_idx');
        $this->dropIndexIfExists('training_plan_assignments', 'tpa_group_status_idx');
        $this->dropIndexIfExists('push_tokens', 'pt_user_active_idx');
    }
};
