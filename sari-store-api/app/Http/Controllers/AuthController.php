<?php

namespace App\Http\Controllers;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Support\Activity;
class AuthController extends Controller
{

private function suspended()
{
    return response()->json(['message' => 'Your account is suspended. Please contact the store owner.'], 403);
}

private function enter(User $user)
{
    if ($user->status === 'suspended') return $this->suspended();
    if (!$user->store_id && $user->pending_store_id) return ['pending' => true, 'email' => $user->email];
    return $this->session($user);
}

    public function forgot(Request $r)
    {
        $v = $r->validate(['email' => 'required|email']);
        $user = User::where('email', $v['email'])->first();

        if ($user) {
            $row = DB::table('password_resets')->where('user_id', $user->getKey())->first();
            $tooSoon = $row && Carbon::parse($row->sent_at)->gt(now()->subSeconds(60));

            if (!$tooSoon) {
                $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                DB::table('password_resets')->updateOrInsert(
                    ['user_id' => $user->getKey()],
                    ['code_hash' => Hash::make($code), 'expires_at' => now()->addMinutes(15), 'attempts' => 0, 'sent_at' => now()]
                );
                try {
                    Mail::raw(
                        "Hi {$user->first_name},\n\nYour Sariventory password reset code is $code.\nIt expires in 15 minutes. If you didn't ask for this, ignore this email and your password stays the same.",
                        fn($m) => $m->to($user->email)->subject('Reset your Sariventory password')
                    );
                } catch (\Throwable $e) { report($e); }
            }
        }
        return ['ok' => true]; // same answer whether or not the email exists
    }

    public function reset(Request $r)
    {
        $v = $r->validate([
            'email' => 'required|email',
            'code' => 'required|digits:6',
            'password' => 'required|string|min:8|max:100',
        ]);
        $user = User::where('email', $v['email'])->first();
        $row = $user ? DB::table('password_resets')->where('user_id', $user->getKey())->first() : null;

        if (!$row) return response()->json(['message' => 'Invalid or expired code'], 422);
        if ($row->attempts >= 5 || now()->gt($row->expires_at)) {
            return response()->json(['message' => 'Code expired. Request a new one.'], 422);
        }
        if (!Hash::check($v['code'], $row->code_hash)) {
            DB::table('password_resets')->where('user_id', $user->getKey())->increment('attempts');
            return response()->json(['message' => 'Wrong code'], 422);
        }

        $user->forceFill(['password_hash' => $v['password']]); // hashed by the model
        if (!$user->email_verified_at) $user->email_verified_at = now(); // they proved they own the email
        $user->save();

        DB::table('password_resets')->where('user_id', $user->getKey())->delete();
        // Log out every device
        DB::table('personal_access_tokens')
            ->where('tokenable_type', User::class)->where('tokenable_id', $user->getKey())->delete();

        return ['ok' => true];
    }
    
    private function sendCode(User $user): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        DB::table('email_verifications')->updateOrInsert(
            ['user_id' => $user->getKey()],
            ['code_hash' => Hash::make($code), 'expires_at' => now()->addMinutes(15), 'attempts' => 0, 'sent_at' => now()]
        );
        Mail::raw(
            "Hi {$user->first_name},\n\nYour Sariventory verification code is $code.\nIt expires in 15 minutes. If you didn't sign up, ignore this email.",
            fn($m) => $m->to($user->email)->subject('Your Sariventory verification code')
        );
    }

    public function verify(Request $r)
    {
        $v = $r->validate(['email' => 'required|email', 'code' => 'required|digits:6']);
        $user = User::where('email', $v['email'])->first();
        $row = $user ? DB::table('email_verifications')->where('user_id', $user->getKey())->first() : null;

        if (!$row) return response()->json(['message' => 'Invalid or expired code'], 422);
        if ($row->attempts >= 5 || now()->gt($row->expires_at)) {
            return response()->json(['message' => 'Code expired. Request a new one.'], 422);
        }
        if (!Hash::check($v['code'], $row->code_hash)) {
            DB::table('email_verifications')->where('user_id', $user->getKey())->increment('attempts');
            return response()->json(['message' => 'Wrong code'], 422);
        }

        DB::table('users')->where('user_id', $user->getKey())->update(['email_verified_at' => now()]);
        DB::table('email_verifications')->where('user_id', $user->getKey())->delete();
        return $this->enter($user->fresh());
    }

    public function resend(Request $r)
    {
        $v = $r->validate(['email' => 'required|email']);
        $user = User::where('email', $v['email'])->first();

        if ($user && !$user->email_verified_at) {
            $row = DB::table('email_verifications')->where('user_id', $user->getKey())->first();
            if ($row && Carbon::parse($row->sent_at)->gt(now()->subSeconds(60))) {
                return response()->json(['message' => 'Wait a minute before asking for another code'], 429);
            }
            try { $this->sendCode($user); } catch (\Throwable $e) { report($e); }
        }
        return ['ok' => true]; // same answer whether or not the email exists
    }

    const JOIN_ROLE = 'viewer';  // role everyone gets when joining with a code
    const STORE_TYPES = ['sari_sari', 'small_business', 'street_vendor', 'mini_grocery', 'food_stall', 'online_seller', 'other'];
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

        public function rejoin(Request $r)
    {
        $v = $r->validate(['email' => 'required|email', 'password' => 'required', 'code' => 'required|string|max:20']);
        $user = User::where('email', $v['email'])->first();

        if (!$user || !Hash::check($v['password'], $user->getAuthPassword())) {
            return response()->json(['message' => 'Wrong email or password'], 401);
        }
                if (config('app.require_email_verification') && !$user->email_verified_at) {
            return response()->json(['message' => 'Please verify your email first', 'needs_verification' => true, 'email' => $user->email], 403);
        }

               if ($user->status === 'suspended') return $this->suspended();
if ($user->pending_store_id) {
    return response()->json(['message' => 'Your request is still waiting for the store owner.'], 422);
}
if ($user->store_id) {
    $isOwner = DB::table('stores')->where('store_id', $user->store_id)->where('owner_id', $user->getKey())->exists();
    return response()->json([
        'message' => $isOwner ? "Store owners can't join other stores."
            : 'You already belong to a store. Ask its owner to remove you first.',
    ], 422);
}
$store = DB::table('stores')->where('join_code', strtoupper(trim($v['code'])))->first();
if (!$store) return response()->json(['message' => 'That store code does not exist'], 422);

$user->forceFill(['pending_store_id' => $store->store_id, 'role' => self::JOIN_ROLE])->save();
Activity::log($store->store_id, 'team', "{$user->name} asked to join the team", $user->getKey());
return ['pending' => true, 'email' => $user->email];

    
    }

    public function login(Request $r)
    {
        $v = $r->validate(['email' => 'required|email', 'password' => 'required']);
        $user = User::where('email', $v['email'])->first();

        if (!$user || !Hash::check($v['password'], $user->getAuthPassword())) {
            return response()->json(['message' => 'Wrong email or password'], 401);
        }
        if ($user->status === 'suspended') return $this->suspended();
        
                if (config('app.require_email_verification') && !$user->email_verified_at) {
            try { $this->sendCode($user); } catch (\Throwable $e) { report($e); }
            return response()->json([
                'message' => 'Please verify your email first. We sent you a new code.',
                'needs_verification' => true, 'email' => $user->email,
            ], 403);
        }

               if (!$user->store_id && !$user->pending_store_id) {
    return response()->json(['message' => 'Your account is not in a store yet.', 'needs_store' => true], 403);
}
return $this->enter($user);
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
            
            'code' => 'required_if:mode,join|nullable|string|max:20',
             'store_type' => ['required_if:mode,create', 'nullable', Rule::in(self::STORE_TYPES)],
            'accept_terms' => 'accepted',
            
        ],
        ['accept_terms.accepted' => 'Please agree to the Terms and Conditions']);

        $store = null;
        
        if ($v['mode'] === 'join') {
            $store = DB::table('stores')->where('join_code', strtoupper(trim($v['code'])))->first();
            if (!$store) return response()->json(['message' => 'That store code does not exist'], 422);
        } 
            
        $user = DB::transaction(function () use ($v, $store) {
                $pendingSid = null;
            if ($v['mode'] === 'create') {
    $sid = DB::table('stores')->insertGetId([
    'name' => $v['store_name'], 'join_code' => self::makeCode(), 'store_type' => $v['store_type'],
]);
    foreach (['Beverages', 'Snacks', 'Canned Goods', 'Household'] as $c) {
        DB::table('categories')->insert(['store_id' => $sid, 'name' => $c]);
    }
            $role = 'owner';
            } else {
    $sid = null;
    $pendingSid = $store->store_id;
    $role = self::JOIN_ROLE;
}
            $u = User::create([
                    'terms_accepted_at' => now(),
    'first_name'    => trim($v['first_name']),
    'middle_name'   => trim($v['middle_name'] ?? '') ?: null,
    'last_name'     => trim($v['last_name']),
    'name'          => trim(implode(' ', array_filter([$v['first_name'], $v['middle_name'] ?? '', $v['last_name']]))),
    'email'         => $v['email'],
    
    'password_hash' => $v['password'], // hashed by the model
    'role'          => $role,
    'store_id' => $sid, 'pending_store_id' => $pendingSid,
    
]);
            if ($role === 'owner') {
                DB::table('stores')->where('store_id', $sid)->update(['owner_id' => $u->getKey()]);
            }
            return $u;
        });

                if ($v['mode'] === 'join') {
    Activity::log($store->store_id, 'team', "{$user->name} asked to join the team", $user->getKey());
}

               if (config('app.require_email_verification')) {
            try { $this->sendCode($user); } catch (\Throwable $e) { report($e); }
            return ['needs_verification' => true, 'email' => $user->email];
        }
       DB::table('users')->where('user_id', $user->getKey())->update(['email_verified_at' => now()]);
        return $this->enter($user->fresh());
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();
        return ['ok' => true];
    }
}