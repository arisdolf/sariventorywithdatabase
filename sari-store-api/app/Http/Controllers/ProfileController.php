<?php

namespace App\Http\Controllers;
use Illuminate\Support\Str;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Support\Activity;
class ProfileController extends Controller
{   
        public function destroy(Request $r)
    {
        $v = $r->validate(['password' => 'required|string', 'confirm' => 'required|in:DELETE']);
        $u = $r->user();
        if (!Hash::check($v['password'], $u->getAuthPassword())) {
            return response()->json(['message' => 'Your password is wrong'], 422);
        }

        $id = $u->getKey();
        $sid = $u->store_id;
        $isOwner = $sid && DB::table('stores')->where('store_id', $sid)->where('owner_id', $id)->exists();

        if ($isOwner && DB::table('users')->where('store_id', $sid)->where('user_id', '!=', $id)->exists()) {
            return response()->json(['message' => 'Remove your team members first (Team page). Deleting the store would lock them out.'], 422);
        }

        DB::transaction(function () use ($id, $sid, $isOwner) {
            if ($isOwner) { // the owner leaving takes the whole store with them
            DB::table('users')->where('pending_store_id', $sid)->update(['pending_store_id' => null]);
                DB::table('orders')->where('store_id', $sid)->delete(); // order items go with them
                DB::table('stock_movements')->where('store_id', $sid)->delete();
                DB::table('products')->where('store_id', $sid)->delete();
                DB::table('suppliers')->where('store_id', $sid)->delete();
                DB::table('categories')->where('store_id', $sid)->delete();
                DB::table('stores')->where('store_id', $sid)->delete();
                DB::table('activity_log')->where('store_id', $sid)->delete();
                DB::table('stock_batches')->where('store_id', $sid)->delete();
                DB::table('expenses')->where('store_id', $sid)->delete();
            }
            DB::table('profiles')->where('user_id', $id)->delete();
            DB::table('personal_access_tokens')->where('tokenable_type', User::class)->where('tokenable_id', $id)->delete();

            // Anonymize instead of deleting the row, so sales this person made keep working
            DB::table('users')->where('user_id', $id)->update([
                'name' => 'Deleted user', 'first_name' => 'Deleted', 'middle_name' => null, 'last_name' => 'user',
                'email' => "deleted-$id@deleted.invalid", 'password_hash' => Hash::make(Str::random(40)),
                'birthdate' => '1900-01-01', 'store_id' => null, 'role' => 'viewer',
            ]);
        });
        return ['ok' => true];
    }
    
    public function show(Request $r)
    {
        $id = $r->user()->getKey();
        $u = DB::table('users')->where('user_id', $id)
            ->first(['first_name', 'middle_name', 'last_name', 'email', 'birthdate']);
        $p = DB::table('profiles')->where('user_id', $id)->first(['phone', 'address', 'city', 'zip_code']);

        return [
            'first_name' => $u->first_name, 'middle_name' => $u->middle_name, 'last_name' => $u->last_name,
            'email' => $u->email, 'birthdate' => $u->birthdate,
            'phone' => $p->phone ?? null, 'address' => $p->address ?? null,
            'city' => $p->city ?? null, 'zip_code' => $p->zip_code ?? null,
        ];
    }

    public function update(Request $r)
    {
        $id = $r->user()->getKey();
        $v = $r->validate([
            'first_name'  => 'required|string|max:60',
            'middle_name' => 'nullable|string|max:60',
            'last_name'   => 'required|string|max:60',
            'birthdate'   => 'required|date|before:today|after:1900-01-01',
            'phone'       => 'nullable|string|max:30',
            'address'     => 'nullable|string|max:255',
            'city'        => 'nullable|string|max:80',
            'zip_code'    => 'nullable|string|max:10',
        ]);

        DB::transaction(function () use ($v, $id) {
            $first = trim($v['first_name']);
            $mid = trim($v['middle_name'] ?? '') ?: null;
            $last = trim($v['last_name']);

            DB::table('users')->where('user_id', $id)->update([
                'first_name' => $first, 'middle_name' => $mid, 'last_name' => $last,
                'name' => trim(implode(' ', array_filter([$first, $mid, $last]))),
                'birthdate' => $v['birthdate'],
            ]);
            DB::table('profiles')->updateOrInsert(['user_id' => $id], [
                'phone' => $v['phone'] ?? null, 'address' => $v['address'] ?? null,
                'city' => $v['city'] ?? null, 'zip_code' => $v['zip_code'] ?? null,
            ]);
        });
        return ['ok' => true];
    }

    public function password(Request $r)
    {
        $v = $r->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|max:100|different:current_password',
        ]);
        $u = $r->user();

        if (!Hash::check($v['current_password'], $u->getAuthPassword())) {
            return response()->json(['message' => 'Your current password is wrong'], 422);
        }

        $u->forceFill(['password_hash' => $v['new_password']])->save(); // hashed by the model

        // Log out every other device, keep this one
        $keep = $u->currentAccessToken()->getKey();
        DB::table('personal_access_tokens')
            ->where('tokenable_type', User::class)->where('tokenable_id', $u->getKey())
            ->where('id', '!=', $keep)->delete();

        return ['ok' => true];
    }

    public function renameStore(Request $r)
    {
        abort_unless($r->user()->hasPerm('team'), 403, 'Only the store owner can rename the store');
        $v = $r->validate(['name' => 'required|string|max:120']);
        DB::table('stores')->where('store_id', $r->user()->store_id)->update(['name' => trim($v['name'])]);
        Activity::log($r->user()->store_id, 'settings', 'Renamed the store to ' . trim($v['name']));
        return ['ok' => true];
    }
}