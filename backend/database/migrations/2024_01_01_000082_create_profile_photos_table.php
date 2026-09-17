<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Swimmer profile photos.
 *
 * Stored in the database, like the platform logo and entry photos: the
 * production storage bucket is write-only and the container disk is wiped on
 * every deploy, so a file on disk would not survive the next release. Each
 * upload gets a fresh random token; the public proxy serves the bytes by that
 * token, so a URL is unguessable and replacing a photo busts every cache.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_photos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('club_id')->index();
            $table->string('token', 40)->unique();
            $table->string('mime', 32);
            $table->unsignedInteger('bytes');
            // base64 of the image; TEXT is 64KB on MySQL, so widen below.
            $table->longText('data');
            $table->timestamps();
        });

        Schema::table('swimmer_profiles', function (Blueprint $table) {
            $table->string('photo_token', 40)->nullable()->after('level');
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->string('photo_token', 40)->nullable()->after('avatar_url');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', fn (Blueprint $table) => $table->dropColumn('photo_token'));
        Schema::table('swimmer_profiles', fn (Blueprint $table) => $table->dropColumn('photo_token'));
        Schema::dropIfExists('profile_photos');
    }
};
