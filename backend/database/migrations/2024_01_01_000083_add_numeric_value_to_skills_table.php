<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            // Used only by type=DISTANCE (the meters value, e.g. 50.00);
            // null for SKILL, SWIM_TYPE and TECHNIQUE.
            $table->decimal('numeric_value', 6, 2)->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn('numeric_value');
        });
    }
};
