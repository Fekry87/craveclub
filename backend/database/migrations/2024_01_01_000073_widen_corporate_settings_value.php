<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Allow storing a base64 image in a setting value. TEXT (64KB) is too
        // small on MySQL; Postgres/SQLite text is already effectively unlimited.
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE corporate_settings MODIFY value LONGTEXT NULL');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE corporate_settings MODIFY value TEXT NULL');
        }
    }
};
