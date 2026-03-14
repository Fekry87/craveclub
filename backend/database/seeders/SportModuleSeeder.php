<?php

namespace Database\Seeders;

use App\Models\SportModule;
use Illuminate\Database\Seeder;

class SportModuleSeeder extends Seeder
{
    public function run(): void
    {
        SportModule::firstOrCreate(['slug' => 'swimming'], [
            'name' => 'Swimming',
            'description' => 'Aquatic sports and swimming programs',
            'icon' => 'drop-fill',
            'color' => '#2B6CB0',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        SportModule::firstOrCreate(['slug' => 'football'], [
            'name' => 'Football',
            'icon' => 'football-fill',
            'color' => '#276749',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        SportModule::firstOrCreate(['slug' => 'basketball'], [
            'name' => 'Basketball',
            'icon' => 'basketball-fill',
            'color' => '#C05621',
            'is_active' => true,
            'sort_order' => 3,
        ]);

        SportModule::firstOrCreate(['slug' => 'tennis'], [
            'name' => 'Tennis',
            'icon' => 'tennis-fill',
            'color' => '#553C9A',
            'is_active' => true,
            'sort_order' => 4,
        ]);
    }
}
