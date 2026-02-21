<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Asociación entre un usuario (auth_user_id del Auth Service) y una tienda.
 * Usado cuando el usuario tiene rol 'store' en Users Service.
 */
class StoreUser extends Model
{
    protected $table = 'store_users';

    protected $fillable = [
        'auth_user_id',
        'store_id',
    ];

    protected function casts(): array
    {
        return [
            'auth_user_id' => 'integer',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
