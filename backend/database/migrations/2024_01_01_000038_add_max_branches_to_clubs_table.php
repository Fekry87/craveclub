<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->integer('max_branches')->default(1)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn('max_branches');
        });
    }
};
