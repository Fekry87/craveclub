<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->string('primary_color')->nullable()->after('theme_color');
            $table->string('secondary_color')->nullable()->after('primary_color');
            $table->string('accent_color')->nullable()->after('secondary_color');
            $table->string('font_preference')->nullable()->after('accent_color');
        });
    }

    public function down(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn(['primary_color', 'secondary_color', 'accent_color', 'font_preference']);
        });
    }
};
