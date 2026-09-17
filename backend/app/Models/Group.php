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

    protected $appends = ['remaining_spots', 'days_of_week_labels'];

    protected function casts(): array
    {
        return [
            'days_of_week' => 'array',
            'capacity' => 'integer',
        ];
    }

    /**
     * Seats left, or null for a group with no capacity limit. Counts memberships
     * fresh each time so it is right inside the approval lock too.
     */
    public function getRemainingSpotsAttribute(): ?int
    {
        if ($this->capacity === null) {
            return null;
        }

        // Prefer a count already in hand (withCount / eager-loaded swimmers) so listing
        // twenty groups does not cost twenty COUNT queries; hit the database otherwise.
        $taken = $this->getAttributes()['swimmers_count']
            ?? ($this->relationLoaded('swimmers') ? $this->swimmers->count() : $this->swimmers()->count());

        return max(0, $this->capacity - (int) $taken);
    }

    public function isFull(): bool
    {
        return $this->capacity !== null && $this->remaining_spots === 0;
    }

    public function getDaysOfWeekLabelsAttribute(): array
    {
        $labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return array_map(fn ($d) => $labels[(int) $d] ?? '?', $this->days_of_week ?? []);
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
