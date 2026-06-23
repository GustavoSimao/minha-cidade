<?php

declare(strict_types=1);

namespace MinhaCidade\Publication\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MinhaCidade\Identity\Models\User;
use MinhaCidade\Publication\Models\Event;
use MinhaCidade\Community\Models\Reaction;
use MinhaCidade\Community\Models\Comment;

class Publication extends Model
{
    protected $fillable = [
        'type',
        'is_anonymous',
        'title',
        'content',
        'image_1',
        'image_2',
        'image_3',
        'video',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function event()
    {
        return $this->hasOne(Event::class);
    }

    public function reactions()
    {
        return $this->hasMany(Reaction::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

}