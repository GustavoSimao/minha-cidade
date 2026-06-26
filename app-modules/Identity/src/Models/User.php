<?php

declare(strict_types=1);

namespace MinhaCidade\Identity\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use MinhaCidade\Community\Models\Friendship;
use MinhaCidade\Publication\Models\Publication;
use MinhaCidade\Publication\Models\Event;
use MinhaCidade\Community\Models\Reaction;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'username',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function sentFriendships(): HasMany
    {
        return $this->hasMany(Friendship::class, 'user_id');
    }

    public function receivedFriendships(): HasMany
    {
        return $this->hasMany(Friendship::class, 'friend_id');
    }

    public function friends(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'friends', 'user_id', 'friend_id')
            ->wherePivot('status', 'accepted');
    }

    public function publications(): HasMany
    {
        return $this->hasMany(Publication::class);
    }

    public function createdEvents(): HasManyThrough
    {
        return $this->hasManyThrough(Event::class, Publication::class);
    }

    public function supportedPublications(): BelongsToMany
    {
        return $this->belongsToMany(Publication::class, 'reactions', 'user_id', 'publication_id')
            ->wherePivot('type', 'support');
    }
}
