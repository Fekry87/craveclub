<?php

use App\Support\SwimmerLogin;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Swimmers can register with their own email, which becomes the login address
 * instead of the generated swimmer_<phone>@club<N> one. Phone sign-in then needs
 * the phone stored on the account rather than parsed out of the address. And a
 * password handed out by the club (approval, reset) must be changed on the
 * first sign-in.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('login_phone', 32)->nullable()->after('email')->index();
            $table->boolean('must_change_password')->default(false)->after('password');
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->string('email')->nullable()->after('phone');
        });

        // Existing swimmers: recover the phone from the generated address.
        DB::table('users')->where('email', 'like', 'swimmer\_%@club%')->orderBy('id')
            ->each(function ($user) {
                $digits = SwimmerLogin::phoneFromEmail($user->email);
                if ($digits !== null) {
                    DB::table('users')->where('id', $user->id)->update(['login_phone' => $digits]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn('email');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['login_phone']);
            $table->dropColumn(['login_phone', 'must_change_password']);
        });
    }
};
