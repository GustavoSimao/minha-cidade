<?php

declare(strict_types=1);

namespace MinhaCidade\Identity\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'bio',
        'email',
        'phone',
        'supported_causes',
        'events_created',
        'events_participating',
        'events_participated',
        'profile_picture',
        'social_links',
        'role',
        'cover_image',
        'is_verified',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}