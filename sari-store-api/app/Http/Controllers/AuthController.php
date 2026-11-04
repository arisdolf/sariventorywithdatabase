<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    const JOIN_ROLE = 'cashier'; // role everyone gets when joining with a code

    public static function makeCode(): string
    {
        do {
            $code = substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 8);
        } while (DB::table('stores')->where('join_code', $code)->exists());
        return $code;
    }

    private function session(User $user)
    {
        return ['token' => $user->createToken('web')->plainTextToken, 'user' => $user->toClient()];
    }

    public function login(Request $r)
    {
        $v = $r->validate(['email' => 'required|email', 'password' => 'required']);
        $user = User::where('email', $v['email'])->first();

        if (!$user || !Hash::check($v['password'], $user->getAuthPassword())) {
            return response()->json(['message' => 'Wrong email or password'], 401);
        }
        if (!$user->store_id) {
            return response()->json(['message' => 'This account is no longer part of a store'], 403);
        }
        return $this->session($user);
    }

    public function register(Request $r)
    {
        $v = $r->validate([
            'mode' => 'required|in:create,join',
            'first_name'  => 'required|string|max:60',
            'middle_name' => 'nullable|string|max:60',
            'last_name'   => 'required|string|max:60',
            'email' => 'required|email|max:150|unique:users,email',
            'password' => 'required|string|min:8|max:100',
            'store_name' => 'required_if:mode,create|nullable|string|max:120',
            'birthdate' => 'required|date|before:today|after:1900-01-01',
            'code' => 'required_if:mode,join|nullable|string|max:20',
        ]);

        $store = null;
        if ($v['mode'] === 'join') {
            $store = DB::table('stores')->where('join_code', strtoupper(trim($v['code'])))->first();
            if (!$store) return response()->json(['message' => 'That store code does not exist'], 422);
        }

        $user = DB::transaction(function () use ($v, $store) {
            if ($v['mode'] === 'create') {
                $sid = DB::table('stores')->insertGetId(['name' => $v['store_name'], 'join_code' => self::makeCode()]);
                $role = 'owner';
            } else {
                $sid = $store->store_id;
                $role = self::JOIN_ROLE;
            }
            $u = User::create([
    'first_name'    => trim($v['first_name']),
    'middle_name'   => trim($v['middle_name'] ?? '') ?: null,
    'last_name'     => trim($v['last_name']),
    'name'          => trim(implode(' ', array_filter([$v['first_name'], $v['middle_name'] ?? '', $v['last_name']]))),
    'email'         => $v['email'],
    'birthdate'     => $v['birthdate'],
    'password_hash' => $v['password'], // hashed by the model
    'role'          => $role,
    'store_id'      => $sid,
]);
            if ($role === 'owner') {
                DB::table('stores')->where('store_id', $sid)->update(['owner_id' => $u->getKey()]);
            }
            return $u;
        });

        return $this->session($user);
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();
        return ['ok' => true];
    }
}