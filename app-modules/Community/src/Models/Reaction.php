<?php

declare(strict_types=1);

namespace MinhaCidade\Community\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MinhaCidade\Identity\Models\User;
use MinhaCidade\Publication\Models\Publication;

class Reaction extends Model
{
    protected $fillable = [
        'type',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }
}
