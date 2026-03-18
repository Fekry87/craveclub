<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
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
        // attendance — covering index for "count present by session" pattern
        $this->addIndexIfColumnsExist('attendance', ['session_id', 'present'], 'att_session_present_idx');

        // daily_evaluations — covering index for rating aggregation GROUP BY
        $this->addIndexIfColumnsExist('daily_evaluations', ['session_id', 'rating'], 'eval_session_rating_idx');

        // training_plan_assignments — covering index for active plan lookups
        $this->addIndexIfColumnsExist('training_plan_assignments', ['club_id', 'swimmer_profile_id', 'status'], 'tpa_club_swimmer_status_idx');
        $this->addIndexIfColumnsExist('training_plan_assignments', ['club_id', 'group_id', 'status'], 'tpa_club_group_status_idx');

        // training_sessions — group+date+status for coach detail weekly queries
        $this->addIndexIfColumnsExist('training_sessions', ['group_id', 'date', 'status'], 'ts_group_date_status_idx');
    }

    public function down(): void
    {
        $this->dropIndexIfExists('attendance', 'att_session_present_idx');
        $this->dropIndexIfExists('daily_evaluations', 'eval_session_rating_idx');
        $this->dropIndexIfExists('training_plan_assignments', 'tpa_club_swimmer_status_idx');
        $this->dropIndexIfExists('training_plan_assignments', 'tpa_club_group_status_idx');
        $this->dropIndexIfExists('training_sessions', 'ts_group_date_status_idx');
    }
};
