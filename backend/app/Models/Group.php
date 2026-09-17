<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use App\Traits\HasSportScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Group extends Model
{
    use BelongsToClub, HasSportScope, SoftDeletes;

    protected $fillable = [
        'club_id', 'name', 'description', 'coach_user_id', 'sport_module_id',
        'group_type', 'capacity', 'days_of_week', 'start_time', 'end_time',
    ];

    // Mirrors the column default, so a freshly created group answers "daily"
    // in the same response instead of null until it is re-read.
    protected $attributes = ['group_type' => 'daily'];

    protected $casts = [
        'days_of_week' => 'array',
        'capacity' => 'integer',
    ];

    /** The same four as subscription plans; a swimmer picks a group inside their plan's type. */
    public const TYPES = SubscriptionPlan::TRAINING_TYPES;

    /** days_of_week holds these indexes: 0 = Sunday … 6 = Saturday. */
    public const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    public function pendingRegistrations()
    {
        return $this->hasMany(Registration::class)->where('status', 'pending');
    }

    /**
     * Spots already spoken for: members plus registrations still waiting for
     * approval — the queue counts, or a full group keeps taking applicants
     * the manager can only reject.
     */
    public function spotsTaken(): int
    {
        $members = $this->swimmers_count ?? $this->swimmers()->count();
        $pending = $this->pending_registrations_count ?? $this->pendingRegistrations()->count();

        return (int) $members + (int) $pending;
    }

    public function remainingSpots(): ?int
    {
        return $this->capacity === null ? null : max(0, $this->capacity - $this->spotsTaken());
    }

    public function isFull(): bool
    {
        return $this->capacity !== null && $this->remainingSpots() === 0;
    }

    /** "Sun, Tue, Thu" — for the app's schedule line. */
    public function dayLabels(): array
    {
        return array_values(array_map(
            fn (int $d) => self::DAY_LABELS[$d] ?? (string) $d,
            $this->days_of_week ?? [],
        ));
    }

    /** "17:30", not "17:30:00": what the app shows and what the form sends back. */
    public function timeShort(?string $time): ?string
    {
        return $time ? substr($time, 0, 5) : null;
    }

    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_user_id');
    }

    public function swimmers()
    {
        return $this->belongsToMany(SwimmerProfile::class, 'group_memberships', 'group_id', 'swimmer_id');
    }

    public function sessions()
    {
        return $this->hasMany(TrainingSession::class);
    }

    public function plans()
    {
        return $this->belongsToMany(TrainingPlan::class, 'group_plan_assignments', 'group_id', 'plan_id');
    }

    public function sportModule()
    {
        return $this->belongsTo(SportModule::class);
    }
}
