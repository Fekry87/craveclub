<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The group the applicant chose (by type + schedule) at registration time. Nullable:
     * older clients and the portal wizard still register by coach alone, in which case
     * approval falls back to the coach's group as before.
     */
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->foreignId('group_id')->nullable()->after('coach_id')
                ->constrained('groups')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('group_id');
        });
    }
};
