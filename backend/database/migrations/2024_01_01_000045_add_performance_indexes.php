<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // registrations table
        Schema::table('registrations', function (Blueprint $table) {
            $table->index('club_id');
            $table->index('status');
            $table->index('branch_id');
            $table->index(['club_id', 'status']);
            $table->index(['club_id', 'created_at']);
        });

        // swimmer_profiles table
        Schema::table('swimmer_profiles', function (Blueprint $table) {
            $table->index('club_id');
            $table->index('branch_id');
            $table->index('user_id');
        });

        // coach_profiles table (already has club_id+branch_id composite)
        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->index('user_id');
        });

        // training_sessions table
        Schema::table('training_sessions', function (Blueprint $table) {
            $table->index('club_id');
            $table->index('date');
            $table->index('group_id');
            $table->index(['club_id', 'date']);
            $table->index(['group_id', 'date']);
        });

        // groups table
        Schema::table('groups', function (Blueprint $table) {
            $table->index('club_id');
            $table->index('coach_user_id');
        });

        // attendance table (hot table — queried every session)
        Schema::table('attendance', function (Blueprint $table) {
            $table->index('swimmer_id');
            $table->index('session_id');
            $table->index(['swimmer_id', 'present']);
        });

        // daily_evaluations table (already has session_id+swimmer_id unique)
        Schema::table('daily_evaluations', function (Blueprint $table) {
            $table->index('swimmer_id');
            $table->index(['swimmer_id', 'created_at']);
        });

        // group_memberships table (already has group_id+swimmer_id unique)
        Schema::table('group_memberships', function (Blueprint $table) {
            $table->index('club_id');
            $table->index('swimmer_id');
        });

        // users table
        Schema::table('users', function (Blueprint $table) {
            $table->index('club_id');
            $table->index('role');
        });

        // branches table
        Schema::table('branches', function (Blueprint $table) {
            $table->index('club_id');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex(['club_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['club_id', 'status']);
            $table->dropIndex(['club_id', 'created_at']);
        });

        Schema::table('swimmer_profiles', function (Blueprint $table) {
            $table->dropIndex(['club_id']);
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('training_sessions', function (Blueprint $table) {
            $table->dropIndex(['club_id']);
            $table->dropIndex(['date']);
            $table->dropIndex(['group_id']);
            $table->dropIndex(['club_id', 'date']);
            $table->dropIndex(['group_id', 'date']);
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropIndex(['club_id']);
            $table->dropIndex(['coach_user_id']);
        });

        Schema::table('attendance', function (Blueprint $table) {
            $table->dropIndex(['swimmer_id']);
            $table->dropIndex(['session_id']);
            $table->dropIndex(['swimmer_id', 'present']);
        });

        Schema::table('daily_evaluations', function (Blueprint $table) {
            $table->dropIndex(['swimmer_id']);
            $table->dropIndex(['swimmer_id', 'created_at']);
        });

        Schema::table('group_memberships', function (Blueprint $table) {
            $table->dropIndex(['club_id']);
            $table->dropIndex(['swimmer_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['club_id']);
            $table->dropIndex(['role']);
        });

        Schema::table('branches', function (Blueprint $table) {
            $table->dropIndex(['club_id']);
        });
    }
};
