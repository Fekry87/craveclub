<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->string('display_name')->nullable()->after('name');
            $table->string('cover_url', 500)->nullable()->after('logo_url');
            $table->string('favicon_url', 500)->nullable()->after('cover_url');
            $table->string('app_name')->nullable()->after('favicon_url');
            $table->string('support_email')->nullable()->after('contact_phone');
            $table->string('support_phone', 20)->nullable()->after('support_email');
            $table->json('social_links')->nullable()->after('support_phone');
            $table->string('custom_domain')->nullable()->unique()->after('social_links');
            $table->boolean('is_domain_active')->default(false)->after('custom_domain');
            $table->string('branding_tier', 20)->default('shared')->after('is_domain_active');
        });
    }

    public function down(): void
    {
        // FIX: Drop unique index on custom_domain before dropping columns (SQLite compat)
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropUnique(['custom_domain']);
        });
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn([
                'display_name', 'cover_url', 'favicon_url', 'app_name',
                'support_email', 'support_phone', 'social_links',
                'custom_domain', 'is_domain_active', 'branding_tier',
            ]);
        });
    }
};
