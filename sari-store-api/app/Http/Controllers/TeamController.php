<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Support\Activity;

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
       $members = DB::select("SELECT user_id id, name, email, role, status FROM users
    WHERE store_id = ? ORDER BY (role = 'owner') DESC, name", [$u->store_id]);
$requests = DB::select("SELECT user_id id, name, email FROM users
    WHERE pending_store_id = ? AND email_verified_at IS NOT NULL ORDER BY created_at", [$u->store_id]);
        $roles = [];
        foreach (User::ROLES as $key => [$label, $perms]) {
            if ($key !== 'owner') $roles[] = ['key' => $key, 'label' => $label, 'perms' => $perms];
        }
        return compact('store', 'members', 'roles', 'requests');
    }

       public function update(Request $r, $id)
    {
        $u = $this->owner($r);
        $v = $r->validate(['role' => ['required', Rule::in(array_diff(array_keys(User::ROLES), ['owner']))]]);
        $m = $this->member($u, $id);
        DB::table('users')->where('user_id', $id)->update(['role' => $v['role']]);
        Activity::log($u->store_id, 'team', "Changed {$m->name}'s role to " . User::ROLES[$v['role']][0]);
        return ['ok' => true];
    }

    public function destroy(Request $r, $id)
    {
        $u = $this->owner($r);
        $m = $this->member($u, $id);
        DB::table('users')->where('user_id', $id)->update(['store_id' => null, 'role' => 'viewer']);
        DB::table('personal_access_tokens')->where('tokenable_type', User::class)->where('tokenable_id', $id)->delete();
        DB::table('users')->where('user_id', $id)->update(['store_id' => null, 'role' => 'viewer', 'status' => 'active']);
        Activity::log($u->store_id, 'team', "Removed {$m->name} from the team");
        return ['ok' => true];
    }

    public function newCode(Request $r)
    {
        $u = $this->owner($r);
        $code = AuthController::makeCode();
        DB::table('stores')->where('store_id', $u->store_id)->update(['join_code' => $code]);
        Activity::log($u->store_id, 'team', 'Made a new store code');
        return ['join_code' => $code];
    }

    public function suspend(Request $r, $id)
{
    $u = $this->owner($r);
    $m = $this->member($u, $id);
    DB::table('users')->where('user_id', $id)->update(['status' => 'suspended']);
    DB::table('personal_access_tokens')->where('tokenable_type', User::class)->where('tokenable_id', $id)->delete();
    Activity::log($u->store_id, 'team', "Suspended {$m->name}'s account");
    return ['ok' => true];
}

public function reactivate(Request $r, $id)
{
    $u = $this->owner($r);
    $m = $this->member($u, $id);
    DB::table('users')->where('user_id', $id)->update(['status' => 'active']);
    Activity::log($u->store_id, 'team', "Reactivated {$m->name}'s account");
    return ['ok' => true];
}

private function request(User $u, $id)
{
    $m = DB::table('users')->where('user_id', $id)->where('pending_store_id', $u->store_id)->first();
    abort_unless($m, 404, 'Request not found');
    return $m;
}

public function approve(Request $r, $id)
{
    $u = $this->owner($r);
    $m = $this->request($u, $id);
    DB::table('users')->where('user_id', $id)->update([
        'store_id' => $u->store_id, 'pending_store_id' => null,
        'role' => AuthController::JOIN_ROLE, 'status' => 'active',
    ]);
    Activity::log($u->store_id, 'team', "Approved {$m->name} to join the team");
    return ['ok' => true];
}

public function decline(Request $r, $id)
{
    $u = $this->owner($r);
    $m = $this->request($u, $id);
    DB::table('users')->where('user_id', $id)->update(['pending_store_id' => null]);
    Activity::log($u->store_id, 'team', "Declined {$m->name}'s request to join");
    return ['ok' => true];
}


}