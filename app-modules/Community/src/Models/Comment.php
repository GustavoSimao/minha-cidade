<?php

declare(strict_types=1);

namespace MinhaCidade\Community\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MinhaCidade\Identity\Models\User;
use MinhaCidade\Publication\Models\Publication;

class Comment extends Model
{
    protected $fillable = [
        'content',
        'is_anonymous',
    ];

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
