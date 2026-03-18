<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->string('guardian_name', 100)->nullable()->after('phone');
            $table->string('guardian_phone', 20)->nullable()->after('guardian_name');
            $table->string('guardian_email', 100)->nullable()->after('guardian_phone');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn(['guardian_name', 'guardian_phone', 'guardian_email']);
        });
    }
};
