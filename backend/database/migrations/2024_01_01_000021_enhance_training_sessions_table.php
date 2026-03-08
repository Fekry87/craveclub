<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_sessions', function (Blueprint $table) {
            $table->string('title')->nullable()->after('plan_id');
            $table->string('type')->default('General')->after('title');
            $table->string('status')->default('Scheduled')->after('type');
            $table->foreignId('coach_user_id')->nullable()->after('club_id')
                ->constrained('users')->onDelete('set null');
            $table->timestamp('started_at')->nullable()->after('notes');
            $table->timestamp('completed_at')->nullable()->after('started_at');
            $table->text('summary_notes')->nullable()->after('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('training_sessions', function (Blueprint $table) {
            $table->dropForeign(['coach_user_id']);
            $table->dropColumn([
                'title', 'type', 'status', 'coach_user_id',
                'started_at', 'completed_at', 'summary_notes',
            ]);
        });
    }
};
