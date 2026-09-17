<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubscriptionPlan extends Model
{
    use SoftDeletes;

    /**
     * How often a plan's member trains. Every plan belongs to exactly one, and
     * the app shows one tab per type the club has active plans in. Order here
     * is display order.
     */
    /** @deprecated read App\Enums\TrainingType::ALL — kept so existing callers keep working */
    public const TRAINING_TYPES = \App\Enums\TrainingType::ALL;

    protected $fillable = [
        'club_id', 'name', 'training_type', 'duration_months', 'price',
        'discount_percent', 'is_popular', 'is_active', 'display_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'duration_months' => 'integer',
            'discount_percent' => 'integer',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Always serialise the price a member actually pays, so no client has to derive it.
     */
    protected $appends = ['final_price'];

    /**
     * `price` is the list price and `discount_percent` is a real reduction on it.
     *
     * This is the single source of truth for what a plan costs. It used to be computed
     * independently in the portal's plan card while the backend recorded the undiscounted
     * `price` on the registration, so the same plan showed 450 on one screen and 500 on
     * the other, and members were billed the number nobody was shown.
     *
     * Rounded to 2dp because it is money, and clamped at 0 in case a 100% discount and
     * floating point conspire to produce -0.0.
     */
    protected function finalPrice(): Attribute
    {
        return Attribute::get(function (): float {
            $price = (float) $this->price;
            $discount = (int) ($this->discount_percent ?? 0);

            if ($discount <= 0) {
                return round($price, 2);
            }

            return max(0.0, round($price * (1 - $discount / 100), 2));
        });
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class, 'plan_id');
    }
}
