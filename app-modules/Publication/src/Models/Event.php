<?php

declare(strict_types=1);

namespace MinhaCidade\Publication\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MinhaCidade\Identity\Models\User;


class Event extends Model
{
    protected $fillable = [
        'data_inicio',
        'data_fim',
        'local',
        'tipo',
        'link_externo',
        'limite_participantes',
    ];

    public function publication()
    {
        return $this->belongsTo(Publication::class);
    }

    public function author()
    {
        return $this->publication()->author();
    }

    

}