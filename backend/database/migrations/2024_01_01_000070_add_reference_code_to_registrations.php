<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->string('reference_code', 16)->nullable()->after('id');
        });

        // Backfill existing rows with unique codes
        foreach (DB::table('registrations')->whereNull('reference_code')->pluck('id') as $id) {
            DB::table('registrations')->where('id', $id)->update([
                'reference_code' => 'REG-'.strtoupper(Str::random(8)),
            ]);
        }

        Schema::table('registrations', function (Blueprint $table) {
            $table->unique('reference_code');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropUnique(['reference_code']);
        });
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn('reference_code');
        });
    }
};
