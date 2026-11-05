<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'first_name', 'middle_name', 'last_name', 'email', 'birthdate', 'password_hash', 'role', 'store_id', 'terms_accepted_at'])]
#[Hidden(['password_hash', 'remember_token'])]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $primaryKey = 'user_id';

    const UPDATED_AT = null;

    // key => [label, permissions]
    const ROLES = [
       'owner'   => ['Owner',   ['sell', 'products', 'stock', 'suppliers', 'costs', 'team', 'history', 'void', 'analytics']],
'manager' => ['Manager', ['sell', 'products', 'stock', 'suppliers', 'costs', 'history', 'void', 'analytics']],
        'cashier'   => ['Cashier',   ['sell', 'history']],
        'inventory' => ['Inventory', ['products', 'stock', 'suppliers']],
        'viewer'    => ['Viewer',    []],
    ];

    public function perms(): array
    {
        return self::ROLES[$this->role][1] ?? [];
    }

    public function hasPerm(string $p): bool
    {
        return in_array($p, $this->perms(), true);
    }

    // What the React app is allowed to know about the logged-in user
       public function toClient(): array
    {
        $s = DB::table('stores')->where('store_id', $this->store_id)->first(['name', 'store_type']);
        return [
            'id' => $this->getKey(),
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'age' => $this->birthdate?->age,
            'roleLabel' => self::ROLES[$this->role][0] ?? $this->role,
            'store' => $s->name ?? null,
            'storeType' => $s->store_type ?? null,
            'perms' => $this->perms(),
        ];
    }
  

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'email_verified_at' => 'datetime',
            'password_hash' => 'hashed',
        ];
    }
}