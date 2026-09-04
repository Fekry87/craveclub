<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PDPL (Saudi Personal Data Protection Law): record WHEN data-processing consent
 * was given for a registration. Nullable so legacy rows and clients that do not
 * yet send `consent_given` keep working.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->timestamp('consent_given_at')->nullable()->after('guardian_email');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn('consent_given_at');
        });
    }
};
