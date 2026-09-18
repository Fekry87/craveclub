<?php

use App\Models\LeaderboardSetting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** The three fixed awards a club started with, in order. */
    private const DEFAULTS = [
        ['key' => 'day', 'name' => 'Man of the Day', 'xp' => 50],
        ['key' => 'week', 'name' => 'Man of the Week', 'xp' => 150],
        ['key' => 'month', 'name' => 'Man of the Month', 'xp' => 400],
    ];

    public function up(): void
    {
        // A club's award titles are now its own to name, price and add to —
        // no longer the fixed Day/Week/Month. Each is a row here; a given
        // award keeps a name + xp snapshot, so deleting a type never rewrites
        // history.
        Schema::create('award_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
            $table->string('name', 60);
            $table->unsignedInteger('xp_value');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index('club_id');
        });

        Schema::table('swimmer_awards', function (Blueprint $table) {
            // Set null on delete: past awards survive their type being removed.
            $table->foreignId('award_type_id')->nullable()->after('swimmer_id')
                ->constrained('award_types')->nullOnDelete();
            // Snapshot of the title at award time (like xp_value already is).
            $table->string('award_name', 60)->nullable()->after('award_type_id');
            // Legacy day|week|month is no longer required for new custom awards.
            $table->string('award_type', 10)->nullable()->change();
        });

        // Seed each club's three defaults from its current XP settings, then
        // point its existing awards at them and snapshot the name.
        foreach (DB::table('clubs')->pluck('id') as $clubId) {
            $settings = LeaderboardSetting::withoutGlobalScopes()->firstWhere('club_id', $clubId);
            $xp = [
                'day' => $settings->award_day_xp ?? 50,
                'week' => $settings->award_week_xp ?? 150,
                'month' => $settings->award_month_xp ?? 400,
            ];

            $idFor = [];
            foreach (self::DEFAULTS as $position => $default) {
                $idFor[$default['key']] = DB::table('award_types')->insertGetId([
                    'club_id' => $clubId,
                    'name' => $default['name'],
                    'xp_value' => $xp[$default['key']],
                    'position' => $position,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            foreach (self::DEFAULTS as $default) {
                DB::table('swimmer_awards')
                    ->where('club_id', $clubId)
                    ->where('award_type', $default['key'])
                    ->update([
                        'award_type_id' => $idFor[$default['key']],
                        'award_name' => $default['name'],
                    ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('swimmer_awards', function (Blueprint $table) {
            $table->dropConstrainedForeignId('award_type_id');
            $table->dropColumn('award_name');
        });
        Schema::dropIfExists('award_types');
    }
};
