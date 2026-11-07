<?php

namespace App\Http\Controllers;

use App\Support\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    const RESETS = ['daily' => 'every day', 'weekly' => 'every week', 'monthly' => 'every month', 'never' => 'never'];

    public function orders(Request $r)
    {
        abort_unless($r->user()->hasPerm('team'), 403, 'Only the store owner can change this');
        $v = $r->validate(['reset' => ['required', Rule::in(array_keys(self::RESETS))]]);
        $sid = $r->user()->store_id;
        DB::table('stores')->where('store_id', $sid)->update(['order_reset' => $v['reset']]);
        Activity::log($sid, 'settings', 'Changed order numbers to restart ' . self::RESETS[$v['reset']]);
        return ['ok' => true];
    }

    public function notify(Request $r)
    {
        $v = $r->validate(['on' => 'required|boolean', 'sales' => 'required|boolean', 'stock' => 'required|boolean', 'team' => 'required|boolean']);
        DB::table('users')->where('user_id', $r->user()->getKey())->update(['notify_prefs' => json_encode($v)]);
        return ['ok' => true];
    }

    // The app asks this every 30 seconds
    public function feed(Request $r)
    {
        $u = $r->user();
        $sid = $u->store_id;
        abort_unless($sid, 403, 'This account is not part of a store');

        $last = (int) DB::table('activity_log')->where('store_id', $sid)->max('activity_id');
        $after = $r->query('after');
        $p = $u->notifyPrefs();
        if ($after === null || !$p['on']) return ['last' => $last, 'items' => []];

        $need = ['sales' => 'history', 'stock' => 'stock', 'team' => 'team'];
        $actions = [];
        foreach ($need as $g => $perm) {
            if ($p[$g] && $u->hasPerm($perm)) $actions = array_merge($actions, Activity::GROUPS[$g]);
        }
        if (!$actions) return ['last' => $last, 'items' => []];

        $me = $u->getKey();
        $items = DB::table('activity_log')
            ->where('store_id', $sid)->where('activity_id', '>', (int) $after)
            ->whereIn('action', $actions)
            ->where(fn($q) => $q->where('user_id', '!=', $me)->orWhereNull('user_id')->orWhere('action', 'lowstock'))
            ->orderBy('activity_id')->limit(10)
            ->get(['activity_id as id', 'action', 'summary']);

        return ['last' => $last, 'items' => $items];
    }
}