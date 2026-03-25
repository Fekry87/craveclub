<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;

class CreateCorporateAdmin extends Command
{
    protected $signature = 'admin:create
        {--email=admin@craveclubs.co : Admin email}
        {--password=CraveClubs@1987 : Admin password}
        {--name=CraveClubs Admin : Admin name}
        {--force : Reset password if user already exists}';

    protected $description = 'Create the corporate PLATFORM_ADMIN user (idempotent — skips if exists unless --force)';

    public function handle(): int
    {
        $email = $this->option('email');
        $name = $this->option('name');
        $password = $this->option('password');

        $existing = User::where('email', $email)->first();

        if ($existing) {
            if ($this->option('force')) {
                $existing->update(['password' => $password]);
                $this->info("Reset password for {$email} (id={$existing->id}).");

                return self::SUCCESS;
            }

            $this->info("User {$email} already exists (id={$existing->id}, role={$existing->role->value}). Skipping.");

            return self::SUCCESS;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => UserRole::PLATFORM_ADMIN,
            'club_id' => null,
        ]);

        $this->info("Created PLATFORM_ADMIN: {$user->email} (id={$user->id})");

        return self::SUCCESS;
    }
}
