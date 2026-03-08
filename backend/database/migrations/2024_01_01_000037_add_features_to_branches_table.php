<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->json('features')->nullable()->after('is_active');
            $table->string('description')->nullable()->after('features');
            $table->integer('capacity')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['features', 'description', 'capacity']);
        });
    }
};
