<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'club_id', 'actor_user_id', 'action', 'entity_type', 'entity_id',
        'before_json', 'after_json', 'ip', 'user_agent', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'before_json' => 'array',
            'after_json' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public function club()
    {
        return $this->belongsTo(Club::class);
    }
}
