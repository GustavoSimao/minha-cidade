<?php

declare(strict_types=1);

namespace MinhaCidade\Community\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MinhaCidade\Identity\Models\User;

class Friendship extends Model
{
    protected $fillable = [
        'status',
    ];

    public function requester()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'friend_id');
    }
}