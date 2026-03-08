<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\SkillType;
use App\Models\Club;
use App\Models\User;
use App\Models\CoachProfile;
use App\Models\SwimmerProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\TrainingPlan;
use App\Models\TrainingPlanItem;
use App\Models\TrainingSession;
use App\Models\Skill;
use App\Models\LeaderboardSetting;
use App\Models\LevelTier;
use App\Models\ClubFeature;
use App\Models\CorporateSetting;
use App\Models\Branch;
use App\Models\Sport;
use App\Models\SubscriptionPlan;
use App\Models\CoachSchedule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // CHANGE BEFORE RUNNING IN ANY SHARED ENVIRONMENT
        $seederPassword = 'Cr@ve' . Str::random(8) . rand(10, 99) . '!';
        Log::info('[DemoSeeder] Generated seed password — check storage/logs/seeder.log');
        file_put_contents(
            storage_path('logs/seeder.log'),
            '[' . now()->toIso8601String() . '] Seeder password: ' . $seederPassword . PHP_EOL,
            FILE_APPEND
        );

        // Platform Admin (CraveClubs Corporate)
        User::create([
            'name' => 'Platform Admin',
            'email' => 'admin@craveclubs.com',
            'password' => $seederPassword, // auto-hashed via User model 'hashed' cast
            'role' => UserRole::PLATFORM_ADMIN,
            'club_id' => null,
        ]);

        // Club — Future Academy
        $club = Club::create([
            'name' => 'Future Academy',
            'slug' => 'future-academy',
            'logo_url' => null,
            'theme_color' => '#0ea5e9',
            'primary_color' => '#0ea5e9',
            'secondary_color' => '#06b6d4',
            'about' => 'Future Academy is a premier swim club dedicated to developing swimmers of all levels. We offer competitive and recreational programs for youth and adults.',
            'contact_email' => 'info@futureacademy.com',
            'contact_phone' => '+1-555-0100',
            'max_branches' => 3,
        ]);

        // Club Manager
        User::create([
            'name' => 'Club Manager',
            'email' => 'manager@futureacademy.com',
            'password' => $seederPassword,
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $club->id,
        ]);

        // Coach 1 (with login)
        $coachUser1 = User::create([
            'name' => 'Coach Ahmed',
            'email' => 'coach1@futureacademy.com',
            'password' => $seederPassword,
            'role' => UserRole::COACH,
            'club_id' => $club->id,
        ]);
        $coachProfile1 = CoachProfile::create([
            'club_id' => $club->id,
            'user_id' => $coachUser1->id,
            'bio' => 'Former national swimmer with 10 years coaching experience.',
            'specialization' => 'Freestyle & Butterfly',
            'phone' => '+1-555-0201',
            'sport_ids' => ['freestyle', 'competitive'],
            'experience_years' => 10,
            'certifications' => ['ASCA Level 3', 'CPR/First Aid'],
            'rating' => 4.8,
            'current_swimmers_count' => 5,
            'is_active' => true,
        ]);

        // Coach 2
        $coachUser2 = User::create([
            'name' => 'Coach Sara',
            'email' => 'coach2@futureacademy.com',
            'password' => $seederPassword,
            'role' => UserRole::COACH,
            'club_id' => $club->id,
        ]);
        $coachProfile2 = CoachProfile::create([
            'club_id' => $club->id,
            'user_id' => $coachUser2->id,
            'bio' => 'Certified swimming instructor specializing in beginners.',
            'specialization' => 'Backstroke & IM',
            'phone' => '+1-555-0202',
            'sport_ids' => ['diving', 'aquafitness'],
            'experience_years' => 6,
            'certifications' => ['WSI Certified', 'Lifeguard'],
            'rating' => 4.5,
            'current_swimmers_count' => 5,
            'is_active' => true,
        ]);

        // Swimmers
        $swimmerNames = [
            ['Ali', 'Hassan'], ['Nour', 'Ibrahim'], ['Omar', 'Said'],
            ['Lina', 'Ahmad'], ['Youssef', 'Mohamed'], ['Mona', 'Khalil'],
            ['Khaled', 'Mansour'], ['Dina', 'Farouk'], ['Tarek', 'Nabil'],
            ['Salma', 'Younes'],
        ];

        $swimmers = [];
        foreach ($swimmerNames as $i => [$first, $last]) {
            $userId = null;
            if ($i === 0) {
                // First swimmer gets a login
                $swimmerUser = User::create([
                    'name' => "$first $last",
                    'email' => 'swimmer1@futureacademy.com',
                    'password' => $seederPassword,
                    'role' => UserRole::SWIMMER,
                    'club_id' => $club->id,
                ]);
                $userId = $swimmerUser->id;
            }

            $swimmers[] = SwimmerProfile::create([
                'club_id' => $club->id,
                'user_id' => $userId,
                'first_name' => $first,
                'last_name' => $last,
                'level' => ['Beginner', 'Intermediate', 'Advanced'][$i % 3],
                'date_of_birth' => Carbon::now()->subYears(rand(8, 16))->subDays(rand(0, 365))->toDateString(),
                'guardian_name' => "Parent of $first",
                'guardian_phone' => '+1-555-' . str_pad(300 + $i, 4, '0', STR_PAD_LEFT),
            ]);
        }

        // Groups
        $group1 = Group::create([
            'club_id' => $club->id,
            'name' => 'Academy Elite',
            'description' => 'Advanced competitive swimmers',
            'coach_user_id' => $coachUser1->id,
        ]);

        $group2 = Group::create([
            'club_id' => $club->id,
            'name' => 'Rising Stars',
            'description' => 'Intermediate development swimmers',
            'coach_user_id' => $coachUser2->id,
        ]);

        // Assign swimmers to groups
        foreach (array_slice($swimmers, 0, 5) as $swimmer) {
            GroupMembership::create([
                'club_id' => $club->id,
                'group_id' => $group1->id,
                'swimmer_id' => $swimmer->id,
            ]);
        }
        foreach (array_slice($swimmers, 5, 5) as $swimmer) {
            GroupMembership::create([
                'club_id' => $club->id,
                'group_id' => $group2->id,
                'swimmer_id' => $swimmer->id,
            ]);
        }

        // Training Plans
        $plan1 = TrainingPlan::create([
            'club_id' => $club->id,
            'title' => 'Sprint Power Session',
            'level' => 'Advanced',
            'description' => 'High intensity sprint training for competitive swimmers.',
        ]);

        $plan1Items = [
            ['sort_order' => 1, 'stroke' => 'Freestyle', 'drill' => 'Warm-up easy swim', 'distance' => '400m', 'reps' => 1, 'interval' => '8:00', 'notes' => 'Easy pace'],
            ['sort_order' => 2, 'stroke' => 'Freestyle', 'drill' => 'Sprint 50s', 'distance' => '50m', 'reps' => 8, 'interval' => '1:00', 'notes' => 'Max effort'],
            ['sort_order' => 3, 'stroke' => 'Butterfly', 'drill' => 'Kick drill', 'distance' => '100m', 'reps' => 4, 'interval' => '2:30', 'notes' => 'With fins'],
            ['sort_order' => 4, 'stroke' => 'Freestyle', 'drill' => 'Cool down', 'distance' => '200m', 'reps' => 1, 'interval' => '5:00', 'notes' => 'Very easy'],
        ];
        foreach ($plan1Items as $item) {
            TrainingPlanItem::create(array_merge($item, ['club_id' => $club->id, 'plan_id' => $plan1->id]));
        }

        $plan2 = TrainingPlan::create([
            'club_id' => $club->id,
            'title' => 'Endurance Builder',
            'level' => 'Intermediate',
            'description' => 'Focus on building aerobic endurance and stroke technique.',
        ]);

        $plan2Items = [
            ['sort_order' => 1, 'stroke' => 'Mixed', 'drill' => 'IM warm-up', 'distance' => '200m', 'reps' => 2, 'interval' => '5:00', 'notes' => 'All four strokes'],
            ['sort_order' => 2, 'stroke' => 'Backstroke', 'drill' => 'Catch-up drill', 'distance' => '100m', 'reps' => 6, 'interval' => '2:00', 'notes' => 'Focus on rotation'],
            ['sort_order' => 3, 'stroke' => 'Breaststroke', 'drill' => 'Pull buoy', 'distance' => '100m', 'reps' => 4, 'interval' => '2:15', 'notes' => 'Strong pull'],
            ['sort_order' => 4, 'stroke' => 'Freestyle', 'drill' => 'Easy swim', 'distance' => '300m', 'reps' => 1, 'interval' => '7:00', 'notes' => 'Cool down'],
        ];
        foreach ($plan2Items as $item) {
            TrainingPlanItem::create(array_merge($item, ['club_id' => $club->id, 'plan_id' => $plan2->id]));
        }

        // Skills
        $skillsData = [
            ['name' => 'Flip Turn', 'type' => SkillType::TECHNIQUE],
            ['name' => 'Streamline', 'type' => SkillType::TECHNIQUE],
            ['name' => 'Freestyle', 'type' => SkillType::SWIM_TYPE],
            ['name' => 'Backstroke', 'type' => SkillType::SWIM_TYPE],
            ['name' => 'Butterfly', 'type' => SkillType::SWIM_TYPE],
            ['name' => 'Breaststroke', 'type' => SkillType::SWIM_TYPE],
            ['name' => 'Diving Start', 'type' => SkillType::SKILL],
            ['name' => 'Treading Water', 'type' => SkillType::SKILL],
        ];
        foreach ($skillsData as $skill) {
            Skill::create(array_merge($skill, ['club_id' => $club->id]));
        }

        // Training Sessions for current week
        $today = Carbon::today();
        $monday = $today->copy()->startOfWeek();

        for ($i = 0; $i < 5; $i++) {
            $date = $monday->copy()->addDays($i);

            TrainingSession::create([
                'club_id' => $club->id,
                'group_id' => $group1->id,
                'plan_id' => $plan1->id,
                'date' => $date->toDateString(),
                'start_time' => '06:00',
                'end_time' => '07:30',
                'location' => 'Olympic Pool - Lane 1-3',
            ]);

            TrainingSession::create([
                'club_id' => $club->id,
                'group_id' => $group2->id,
                'plan_id' => $plan2->id,
                'date' => $date->toDateString(),
                'start_time' => '16:00',
                'end_time' => '17:30',
                'location' => 'Olympic Pool - Lane 4-6',
            ]);
        }

        // ── Leaderboard Settings & Level Tiers ──
        LeaderboardSetting::forClub($club->id);
        LevelTier::seedForClub($club->id);

        // ── Corporate Settings (CraveClubs) ──
        CorporateSetting::set('platform_name', 'CraveClubs');
        CorporateSetting::set('platform_logo_url', null);
        CorporateSetting::set('primary_color', '#8b5cf6');
        CorporateSetting::set('secondary_color', '#22d3ee');
        CorporateSetting::set('tagline', 'Club Management Platform');

        // ── Club Features (all enabled for demo) ──
        ClubFeature::create(['club_id' => $club->id]);

        // ── Branches ──
        $mainBranch = Branch::create([
            'club_id' => $club->id,
            'name' => 'Main Branch',
            'address' => '123 Olympic Avenue',
            'city' => 'Cairo',
            'phone' => '+20-100-1234567',
            'working_hours' => '06:00 - 22:00',
            'description' => 'Our flagship location with Olympic-sized pool.',
            'capacity' => 100,
            'is_active' => true,
        ]);

        $downtownBranch = Branch::create([
            'club_id' => $club->id,
            'name' => 'Downtown Branch',
            'address' => '456 Nile Street',
            'city' => 'Cairo',
            'phone' => '+20-100-7654321',
            'working_hours' => '07:00 - 21:00',
            'description' => 'Convenient downtown location for after-work sessions.',
            'capacity' => 50,
            'features' => ['leaderboard' => false],
            'is_active' => true,
        ]);

        // Assign coaches to branches
        $coachProfile1->update(['branch_id' => $mainBranch->id]);
        $coachProfile2->update(['branch_id' => $downtownBranch->id]);

        // Assign swimmers to branches (first 5 → main, next 5 → downtown)
        foreach (array_slice($swimmers, 0, 5) as $swimmer) {
            $swimmer->update(['branch_id' => $mainBranch->id]);
        }
        foreach (array_slice($swimmers, 5, 5) as $swimmer) {
            $swimmer->update(['branch_id' => $downtownBranch->id]);
        }

        // ── Sports ──
        Sport::create(['club_id' => $club->id, 'name' => 'Freestyle Swimming', 'slug' => 'freestyle', 'description' => 'Front crawl and freestyle techniques', 'is_active' => true]);
        Sport::create(['club_id' => $club->id, 'name' => 'Competitive Swimming', 'slug' => 'competitive', 'description' => 'Competitive race training and events', 'is_active' => true]);
        Sport::create(['club_id' => $club->id, 'name' => 'Diving', 'slug' => 'diving', 'description' => 'Platform and springboard diving', 'is_active' => true]);
        Sport::create(['club_id' => $club->id, 'name' => 'Aqua Fitness', 'slug' => 'aquafitness', 'description' => 'Water-based fitness and aerobics', 'is_active' => true]);

        // ── Subscription Plans ──
        SubscriptionPlan::create(['club_id' => $club->id, 'name' => 'Monthly', 'duration_months' => 1, 'price' => 500.00, 'discount_percent' => 0, 'is_popular' => false, 'is_active' => true, 'display_order' => 0]);
        SubscriptionPlan::create(['club_id' => $club->id, 'name' => 'Quarterly', 'duration_months' => 3, 'price' => 1200.00, 'discount_percent' => 20, 'is_popular' => true, 'is_active' => true, 'display_order' => 1]);
        SubscriptionPlan::create(['club_id' => $club->id, 'name' => 'Annual', 'duration_months' => 12, 'price' => 3600.00, 'discount_percent' => 40, 'is_popular' => false, 'is_active' => true, 'display_order' => 2]);

        // ── Coach Schedules ──
        $defaultSlots = [
            ['time' => '08:00', 'is_available' => true, 'max_capacity' => 10],
            ['time' => '10:00', 'is_available' => true, 'max_capacity' => 10],
            ['time' => '16:00', 'is_available' => true, 'max_capacity' => 10],
        ];

        foreach ([$coachProfile1, $coachProfile2] as $coach) {
            foreach (['Monday', 'Wednesday', 'Friday'] as $day) {
                CoachSchedule::create([
                    'coach_id' => $coach->id,
                    'day_of_week' => $day,
                    'slots' => $defaultSlots,
                ]);
            }
        }
    }
}
