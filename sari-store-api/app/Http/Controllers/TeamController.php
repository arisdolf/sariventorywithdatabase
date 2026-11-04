<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TeamController extends Controller
{
    private function owner(Request $r): User
    {
        abort_unless($r->user()->hasPerm('team'), 403, 'Only the store owner can manage the team');
        return $r->user();
    }

    private function member(User $u, $id)
    {
        $m = DB::table('users')->where('user_id', $id)->where('store_id', $u->store_id)->first();
        abort_unless($m, 404, 'Member not found');
        abort_if($m->role === 'owner', 403, 'The owner cannot be changed');
        return $m;
    }

    public function index(Request $r)
    {
        $u = $this->owner($r);
        $store = DB::table('stores')->where('store_id', $u->store_id)->first(['name', 'join_code']);
        $members = DB::select("SELECT user_id id, name, email, role FROM users
            WHERE store_id = ? ORDER BY (role = 'owner') DESC, name", [$u->store_id]);
        $roles = [];
        foreach (User::ROLES as $key => [$label, $perms]) {
            if ($key !== 'owner') $roles[] = ['key' => $key, 'label' => $label, 'perms' => $perms];
        }
        return compact('store', 'members', 'roles');
    }

    public function update(Request $r, $id)
    {
        $u = $this->owner($r);
        $v = $r->validate(['role' => ['required', Rule::in(array_diff(array_keys(User::ROLES), ['owner']))]]);
        $this->member($u, $id);
        DB::table('users')->where('user_id', $id)->update(['role' => $v['role']]);
        return ['ok' => true];
    }

    public function destroy(Request $r, $id)
    {
        $u = $this->owner($r);
        $this->member($u, $id);
        DB::table('users')->where('user_id', $id)->update(['store_id' => null, 'role' => 'viewer']);
        DB::table('personal_access_tokens')->where('tokenable_type', User::class)->where('tokenable_id', $id)->delete();
        return ['ok' => true];
    }

    public function newCode(Request $r)
    {
        $u = $this->owner($r);
        $code = AuthController::makeCode();
        DB::table('stores')->where('store_id', $u->store_id)->update(['join_code' => $code]);
        return ['join_code' => $code];
    }
}