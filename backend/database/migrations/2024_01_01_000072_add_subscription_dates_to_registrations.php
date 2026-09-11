<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->date('subscription_started_at')->nullable()->after('status');
            $table->date('subscription_ends_at')->nullable()->after('subscription_started_at');
        });

        // Backfill existing approved/active registrations from the previous
        // derivation (updated_at + plan.duration_months) so nothing regresses.
        $rows = DB::table('registrations')
            ->join('subscription_plans', 'registrations.plan_id', '=', 'subscription_plans.id')
            ->whereIn('registrations.status', ['approved', 'active'])
            ->whereNull('registrations.subscription_ends_at')
            ->select('registrations.id', 'registrations.updated_at', 'subscription_plans.duration_months')
            ->get();

        foreach ($rows as $row) {
            if (! $row->duration_months) {
                continue;
            }
            $start = \Carbon\Carbon::parse($row->updated_at)->startOfDay();
            DB::table('registrations')->where('id', $row->id)->update([
                'subscription_started_at' => $start->toDateString(),
                'subscription_ends_at' => $start->copy()->addMonths((int) $row->duration_months)->toDateString(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn(['subscription_started_at', 'subscription_ends_at']);
        });
    }
};
