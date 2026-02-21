<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    public const ROLE_CUSTOMER = 'customer';

    public const ROLE_DRIVER = 'driver';

    public const ROLE_STORE = 'store';

    protected $fillable = [
        'auth_user_id',
        'name',
        'email',
        'phone',
        'role',
    ];

    protected function casts(): array
    {
        return [];
    }

    public function isDriver(): bool
    {
        return $this->role === self::ROLE_DRIVER;
    }

    public function isCustomer(): bool
    {
        return $this->role === self::ROLE_CUSTOMER;
    }

    public function isStore(): bool
    {
        return $this->role === self::ROLE_STORE;
    }
}
